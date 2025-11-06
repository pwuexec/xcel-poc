"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    const currentDate = currentTimestamp ? new Date(currentTimestamp) : new Date();
    const ukDateString = currentDate.toLocaleDateString('en-GB', {
        timeZone: 'Europe/London',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).split('/').reverse().join('-');

    const ukTimeString = currentDate.toLocaleTimeString('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const [date, setDate] = useState(ukDateString);
    const [time, setTime] = useState(ukTimeString);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const rescheduleBooking = useMutation(api.bookings.integrations.writes.rescheduleBookingMutation);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!date || !time) {
            alert("Please fill in all fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const newTimestamp = new Date(`${date}T${time}`).getTime();
            await rescheduleBooking({
                bookingId,
                newTimestamp,
            });

            // Call onSuccess first to close dialog
            onSuccess?.();

            // Then show success message
            alert("Booking rescheduled successfully!");
        } catch (error) {
            console.error("Failed to reschedule booking:", error);
            alert(error instanceof Error ? error.message : "Failed to reschedule booking. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="date">New Date (UK Time)</Label>
                <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="time">New Time (UK Time)</Label>
                <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                />
            </div>

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
