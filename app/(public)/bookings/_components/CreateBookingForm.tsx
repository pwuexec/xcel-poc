"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BOOKING_ERRORS } from "@/convex/constants/errors";
import { DatePicker, TimeSlotPicker, formatBookingDateTime, isBookingDateTimeValid, ukDateTimeToUTC } from "./shared";
import { UserSelector } from "./create-booking-form/UserSelector";
import { BookingTypeDisplay } from "./create-booking-form/BookingTypeDisplay";

interface CreateBookingFormProps {
    onSuccess?: () => void;
}

export default function CreateBookingForm({ onSuccess }: CreateBookingFormProps) {
    const [toUserId, setToUserId] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [time, setTime] = useState("");
    const [bookingType, setBookingType] = useState<"free" | "paid" | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                setBookingType("free");
            } else if (!eligibility.canCreateFreeBooking && eligibility.canCreatePaidBooking) {
                setBookingType("paid");
            } else if (eligibility.canCreateFreeBooking && eligibility.canCreatePaidBooking) {
                // Both available, let user choose (default to free)
                if (!bookingType) {
                    setBookingType("free");
                }
            } else {
                setBookingType(null);
            }
        }
    }, [eligibility]);

    // Reset booking type when user changes
    useEffect(() => {
        setBookingType(null);
    }, [toUserId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!toUserId || !selectedDate || !time) {
            setError("Please fill in all fields");
            return;
        }

        if (!bookingType) {
            setError("Please select a booking type");
            return;
        }

        // Validate that the booking is not in the past
        if (!isBookingDateTimeValid(selectedDate, time)) {
            setError("Cannot create a booking in the past. Please select a future date and time.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Frontend works in UK timezone (Europe/London)
            // Server stores timestamps in UTC
            // Convert UK date/time to UTC timestamp using helper
            const timestamp = ukDateTimeToUTC(selectedDate, time);
            
            await createBooking({
                toUserId: toUserId as Id<"users">,
                timestamp,
                bookingType,
            });

            // Reset form
            setToUserId("");
            setSelectedDate(undefined);
            setTime("");
            setBookingType(null);

            // Call onSuccess first to close dialog
            onSuccess?.();
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                if (error.message.includes(BOOKING_ERRORS.FREE_MEETING_ACTIVE)) {
                    setError(BOOKING_ERRORS.FREE_MEETING_ACTIVE);
                    return;
                }
            }

            setError(error instanceof Error ? error.message : "Failed to create booking");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="grid w-full max-w-xl items-start gap-4">
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            )}

            <UserSelector
                value={toUserId}
                onChange={setToUserId}
                users={allUsers}
                label={selectLabel}
                placeholder={selectPlaceholder}
            />

            {eligibility && toUserId && (
                <BookingTypeDisplay eligibility={eligibility} isTutor={isTutor} />
            )}

            <DatePicker value={selectedDate} onChange={setSelectedDate} />

            <TimeSlotPicker
                availableSlots={timeSlots?.availableSlots || []}
                busySlots={timeSlots?.busySlots || []}
                selectedTime={time}
                onSelectTime={setTime}
                isLoading={timeSlots === undefined && !!dateString && !!bookingType}
            />

            {selectedDate && time && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                    <p className="text-sm text-muted-foreground">
                        Booking will be scheduled at{" "}
                        <span className="font-medium text-foreground">
                            {formatBookingDateTime(selectedDate, time)}
                        </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        All times are in UK timezone (Europe/London)
                    </p>
                </div>
            )}

            <div className="flex gap-3 pt-4">
                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || !bookingType || (eligibility && eligibility.hasActiveFreeBooking)}
                >
                    {isSubmitting ? "Creating..." : "Create Booking"}
                </Button>
            </div>
        </form>
    );
}
