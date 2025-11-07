"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DatePicker, TimeSlotPicker, formatBookingDateTime, isBookingDateTimeValid, ukDateTimeToUTC } from "./shared";

interface RescheduleBookingFormProps {
    bookingId: Id<"bookings">;
    currentTimestamp?: number;
    onSuccess?: () => void;
}

export default function RescheduleBookingForm({
    bookingId,
    currentTimestamp,
    onSuccess,
}: RescheduleBookingFormProps) {
    // Initialize with current booking time
    const currentDate = currentTimestamp ? new Date(currentTimestamp) : undefined;
    
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentDate);
    const [time, setTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const rescheduleBooking = useMutation(api.bookings.integrations.writes.rescheduleBookingMutation);
    
    // Get booking details to know the users and booking type
    const bookings = useQuery(api.bookings.integrations.reads.getMyBookingsWithCounts, {
        paginationOpts: { numItems: 1000, cursor: null },
    });
    
    const bookingData = bookings?.page.find(b => b.booking._id === bookingId);
    const booking = bookingData?.booking;
    const currentUser = useQuery(api.users.integrations.reads.getMe);
    
    // Determine the other user
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
                excludeBookingId: bookingId,
            }
            : "skip"
    );

    // Initialize time if we have a current timestamp
    useState(() => {
        if (currentTimestamp) {
            const date = new Date(currentTimestamp);
            const ukTimeString = date.toLocaleTimeString('en-GB', {
                timeZone: 'Europe/London',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            setTime(ukTimeString);
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!selectedDate || !time) {
            setError("Please fill in all fields");
            return;
        }

        // Validate that the booking is not in the past
        if (!isBookingDateTimeValid(selectedDate, time)) {
            setError("Cannot reschedule to a past time. Please select a future date and time.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Frontend works in UK timezone (Europe/London)
            // Server stores timestamps in UTC
            // Convert UK date/time to UTC timestamp using helper
            const newTimestamp = ukDateTimeToUTC(selectedDate, time);
            
            await rescheduleBooking({
                bookingId,
                newTimestamp,
            });

            // Call onSuccess first to close dialog
            onSuccess?.();
        } catch (error) {
            console.error("Failed to reschedule booking:", error);
            setError(error instanceof Error ? error.message : "Failed to reschedule booking. Please try again.");
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

            <DatePicker 
                value={selectedDate} 
                onChange={setSelectedDate}
                label="New Date"
            />

            <TimeSlotPicker
                availableSlots={timeSlots?.availableSlots || []}
                busySlots={timeSlots?.busySlots || []}
                selectedTime={time}
                onSelectTime={setTime}
                label="Available Times for Reschedule"
                isLoading={timeSlots === undefined && !!dateString && !!booking}
            />

            {selectedDate && time && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                    <p className="text-sm text-muted-foreground">
                        Booking will be rescheduled to{" "}
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
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Rescheduling..." : "Reschedule Booking"}
                </Button>
            </div>
        </form>
    );
}
