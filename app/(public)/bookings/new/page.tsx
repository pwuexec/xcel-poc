"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { BOOKING_ERRORS } from "@/convex/constants/errors";
import { 
    DatePicker, 
    TimeSlotPicker, 
    isBookingDateTimeValid, 
    ukDateTimeToUTC,
    BookingPageHeader,
    BookingFormActions,
    FormError
} from "../_components";
import { UserSelector, BookingPreview, BookingEligibilityAlert } from "./_components";
import { getBookingDurationMinutes } from "@/convex/bookings/utils";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const bookingSchema = z.object({
    toUserId: z.string().min(1, "Please select a tutor/student"),
    selectedDate: z.date().optional(),
    time: z.string().min(1, "Please select a time slot"),
    bookingType: z.enum(["free", "paid"]).optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function NewBookingPage() {
    const router = useRouter();
    const {
        watch,
        setValue,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        clearErrors,
    } = useForm<BookingFormData>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            toUserId: "",
            time: "",
        },
    });

    const toUserId = watch("toUserId");
    const selectedDate = watch("selectedDate");
    const time = watch("time");
    const bookingType = watch("bookingType");

    const createBooking = useMutation(api.bookings.integrations.writes.createBookingMutation);
    const allUsers = useQuery(api.users.integrations.reads.getAllUsers);
    const currentUser = useQuery(api.users.integrations.reads.getMe);
    
    // Get booking eligibility for selected user
    const eligibility = useQuery(
        api.bookings.integrations.reads.getBookingEligibility,
        toUserId ? { otherUserId: toUserId as Id<"users"> } : "skip"
    );

    // Get available time slots when date and users are selected
    const dateString = selectedDate?.toISOString().split('T')[0];
    const timeSlots = useQuery(
        api.bookings.integrations.reads.getAvailableTimeSlots,
        toUserId && dateString && bookingType
            ? {
                date: dateString,
                toUserId: toUserId as Id<"users">,
                bookingType: bookingType,
            }
            : "skip"
    );

    // Determine if current user is a tutor
    const isTutor = currentUser?.role === "tutor";
    const selectLabel = isTutor ? "Select Student" : "Select Tutor";
    const selectPlaceholder = isTutor ? "Select a student..." : "Select a tutor...";

    // Auto-set booking type based on eligibility
    useEffect(() => {
        if (eligibility) {
            if (eligibility.canCreateFreeBooking && !eligibility.canCreatePaidBooking) {
                setValue("bookingType", "free");
            } else if (!eligibility.canCreateFreeBooking && eligibility.canCreatePaidBooking) {
                setValue("bookingType", "paid");
            } else if (eligibility.canCreateFreeBooking && eligibility.canCreatePaidBooking) {
                // Both available, let user choose (default to free)
                if (!bookingType) {
                    setValue("bookingType", "free");
                }
            }
        }
    }, [eligibility, bookingType, setValue]);

    // Reset booking type when user changes
    useEffect(() => {
        setValue("bookingType", undefined as any);
        setValue("selectedDate", undefined as any);
        setValue("time", "");
    }, [toUserId, setValue]);

    const onSubmit = async (data: BookingFormData) => {
        clearErrors();

        if (!data.selectedDate) {
            setError("root", { message: "Please select a date" });
            return;
        }

        if (!data.bookingType) {
            setError("root", { message: "Please select a booking type" });
            return;
        }

        // Validate that the booking is not in the past
        if (!isBookingDateTimeValid(data.selectedDate, data.time)) {
            setError("root", {
                message: "Cannot create a booking in the past. Please select a future date and time.",
            });
            return;
        }

        try {
            // Frontend works in UK timezone (Europe/London)
            // Server stores timestamps in UTC
            // Convert UK date/time to UTC timestamp using helper
            const timestamp = ukDateTimeToUTC(data.selectedDate, data.time);
            
            await createBooking({
                toUserId: data.toUserId as Id<"users">,
                timestamp,
                bookingType: data.bookingType,
            });

            // Navigate back to bookings page
            router.push("/bookings");
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                if (error.message.includes(BOOKING_ERRORS.FREE_MEETING_ACTIVE)) {
                    setError("root", { message: BOOKING_ERRORS.FREE_MEETING_ACTIVE });
                    return;
                }
                setError("root", { message: error.message });
            } else {
                setError("root", { message: "Failed to create booking" });
            }
        }
    };

    const steps = [
        { label: `1. Select ${isTutor ? 'Student' : 'Tutor'}`, completed: !!toUserId },
        { label: "2. Pick Date", completed: !!selectedDate },
        { label: "3. Choose Time", completed: !!time },
    ];

    return (
        <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <BookingPageHeader
                title="Book a New Session"
                description="Schedule a session"
                icon={CalendarIcon}
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormError error={errors.root?.message} />

                <UserSelector
                    value={toUserId}
                    onChange={(value) => setValue("toUserId", value)}
                    users={allUsers}
                    label={selectLabel}
                    placeholder={selectPlaceholder}
                />

                {eligibility && toUserId && (
                    <BookingEligibilityAlert
                        canCreateFreeBooking={eligibility.canCreateFreeBooking}
                        canCreatePaidBooking={eligibility.canCreatePaidBooking}
                        hasActiveFreeBooking={eligibility.hasActiveFreeBooking}
                    />
                )}

                {selectedDate && time && bookingType && toUserId && (
                    <BookingPreview
                        selectedDate={selectedDate}
                        selectedTime={time}
                        userName={allUsers?.find(u => u._id === toUserId)?.name || ""}
                        userRole={isTutor ? "student" : "tutor"}
                        bookingType={bookingType}
                    />
                )}

                <DatePicker 
                    value={selectedDate} 
                    onChange={(date) => setValue("selectedDate", date as Date)}
                    disabled={!toUserId || (eligibility?.hasActiveFreeBooking ?? false)}
                />

                <TimeSlotPicker
                    availableSlots={timeSlots?.availableSlots || []}
                    busySlots={timeSlots?.busySlots || []}
                    selectedTime={time}
                    onSelectTime={(time) => setValue("time", time)}
                    isLoading={timeSlots === undefined && !!dateString && !!bookingType}
                    bookingDurationMinutes={bookingType ? getBookingDurationMinutes(bookingType) : undefined}
                    disabled={!toUserId || !selectedDate || (eligibility?.hasActiveFreeBooking ?? false)}
                />

                <BookingFormActions
                    isSubmitting={isSubmitting}
                    isDisabled={!bookingType || (eligibility?.hasActiveFreeBooking ?? false)}
                    submitLabel="Create Booking"
                    submittingLabel="Creating..."
                />
            </form>
        </div>
    );
}
