"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface RescheduleBookingFormProps {
    bookingId: Id<"bookings">;
    currentTimestamp: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function RescheduleBookingForm({
    bookingId,
    currentTimestamp,
    isOpen,
    onClose,
}: RescheduleBookingFormProps) {
    // Initialize form with current booking time in UK timezone
    const currentDate = new Date(currentTimestamp);
    const ukDateString = currentDate.toLocaleDateString('en-GB', {
        timeZone: 'Europe/London',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).split('/').reverse().join('-'); // Convert DD/MM/YYYY to YYYY-MM-DD
    
    const ukTimeString = currentDate.toLocaleTimeString('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    const [date, setDate] = useState(ukDateString);
    const [time, setTime] = useState(ukTimeString);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const rescheduleBooking = useMutation(api.schemas.bookings.rescheduleBooking);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!date || !time) {
            alert("Please fill in all fields");
            return;
        }

        setIsSubmitting(true);
        try {
            // Parse date and time as UK timezone (Europe/London)
            // The input gives us local time, which for UK users is already in UK timezone
            const newTimestamp = new Date(`${date}T${time}`).getTime();
            await rescheduleBooking({
                bookingId,
                newTimestamp,
            });

            onClose();
            alert("Booking rescheduled successfully!");
        } catch (error) {
            console.error("Failed to reschedule booking:", error);
            alert(error instanceof Error ? error.message : "Failed to reschedule booking. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        Reschedule Booking
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="date"
                            className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
                        >
                            New Date (UK Time)
                        </label>
                        <input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="time"
                            className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
                        >
                            New Time (UK Time)
                        </label>
                        <input
                            id="time"
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Rescheduling..." : "Reschedule"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
