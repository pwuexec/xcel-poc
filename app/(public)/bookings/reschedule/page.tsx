"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { 
    DatePicker, 
    TimeSlotPicker, 
    isBookingDateTimeValid, 
    ukDateTimeToUTC,
    formatUKDateTime,
    BookingPageHeader,
    BookingFormActions,
    FormError
} from "../_components";
import { RescheduleComparison } from "./_components";
import { getBookingDurationMinutes } from "@/convex/bookings/utils";
import { CalendarIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const rescheduleSchema = z.object({
    selectedDate: z.date().optional(),
    time: z.string().min(1, "Please select a time slot"),
});

type RescheduleFormData = z.infer<typeof rescheduleSchema>;

export default function RescheduleBookingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get("id") as Id<"bookings"> | null;

    const {
        watch,
        setValue,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        clearErrors,
    } = useForm<RescheduleFormData>({
        resolver: zodResolver(rescheduleSchema),
        defaultValues: {
            time: "",
        },
    });

    const selectedDate = watch("selectedDate");
    const time = watch("time");

    const rescheduleBooking = useMutation(api.bookings.integrations.writes.rescheduleBookingMutation);
    const currentUser = useQuery(api.users.integrations.reads.getMe);
    
    // Get booking details
    const bookings = useQuery(api.bookings.integrations.reads.getMyBookingsWithCounts, {
        paginationOpts: { numItems: 1000, cursor: null },
    });
    
    const bookingData = bookings?.page.find(b => b.booking._id === bookingId);
    const booking = bookingData?.booking;
    const fromUser = bookingData?.fromUser;
    const toUser = bookingData?.toUser;

    // Determine the other user and roles
    const isTutor = currentUser?.role === "tutor";
    const otherUser = isTutor ? fromUser : toUser;
    const otherUserId = booking && currentUser 
        ? (booking.fromUserId === currentUser._id ? booking.toUserId : booking.fromUserId)
        : undefined;

    // Get available time slots when date is selected
    const dateString = selectedDate?.toISOString().split('T')[0];
    const timeSlots = useQuery(
        api.bookings.integrations.reads.getAvailableTimeSlots,
        booking && otherUserId && dateString
            ? {
                date: dateString,
                toUserId: otherUserId,
                bookingType: booking.bookingType,
                excludeBookingId: bookingId || undefined,
            }
            : "skip"
    );

    // Redirect if no booking ID
    useEffect(() => {
        if (!bookingId) {
            router.push("/bookings");
        }
    }, [bookingId, router]);

    // Initialize with current booking time
    useEffect(() => {
        if (booking && !selectedDate) {
            const currentDate = new Date(booking.timestamp);
            setValue("selectedDate", currentDate);
            
            const ukTimeString = currentDate.toLocaleTimeString('en-GB', {
                timeZone: 'Europe/London',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            setValue("time", ukTimeString);
        }
    }, [booking, selectedDate, setValue]);

    const onSubmit = async (data: RescheduleFormData) => {
        if (!bookingId) return;
        
        clearErrors();

        if (!data.selectedDate) {
            setError("root", { message: "Please select a date" });
            return;
        }

        // Validate that the booking is not in the past
        if (!isBookingDateTimeValid(data.selectedDate, data.time)) {
            setError("root", {
                message: "Cannot reschedule to a past time. Please select a future date and time.",
            });
            return;
        }

        try {
            // Frontend works in UK timezone (Europe/London)
            // Server stores timestamps in UTC
            // Convert UK date/time to UTC timestamp using helper
            const newTimestamp = ukDateTimeToUTC(data.selectedDate, data.time);
            
            await rescheduleBooking({
                bookingId,
                newTimestamp,
            });

            // Navigate back to bookings page
            router.push("/bookings");
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                setError("root", { message: error.message });
            } else {
                setError("root", { message: "Failed to reschedule booking" });
            }
        }
    };

    if (!bookingId || !booking) {
        return (
            <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <BookingPageHeader
                title="Reschedule Session"
                description="Choose a new time for your session"
                icon={CalendarIcon}
            />

            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs sm:text-sm text-muted-foreground">
                <span>With</span>
                <span className="font-medium text-foreground">{otherUser?.name || "..."}</span>
                <span>•</span>
                <span>{formatUKDateTime(booking.timestamp)}</span>
            </div>

            {selectedDate && time && (
                <RescheduleComparison
                    currentTimestamp={booking.timestamp}
                    newDate={selectedDate}
                    newTime={time}
                    bookingType={booking.bookingType}
                />
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormError error={errors.root?.message} />

                <DatePicker 
                    value={selectedDate} 
                    onChange={(date) => setValue("selectedDate", date as Date)}
                    label="New Date"
                />

                {selectedDate && (
                    <TimeSlotPicker
                        availableSlots={timeSlots?.availableSlots || []}
                        busySlots={timeSlots?.busySlots || []}
                        selectedTime={time}
                        onSelectTime={(time) => setValue("time", time)}
                        label="Available Times"
                        isLoading={timeSlots === undefined && !!dateString}
                        bookingDurationMinutes={getBookingDurationMinutes(booking.bookingType)}
                    />
                )}

                <BookingFormActions
                    isSubmitting={isSubmitting}
                    submitLabel="Reschedule Session"
                    submittingLabel="Rescheduling..."
                />
            </form>
        </div>
    );
}
