"use client";

import { CalendarIcon, ClockIcon, CheckIcon } from "lucide-react";
import { getBookingDurationMinutes, formatBookingTimeRange } from "@/convex/bookings/utils";
import { formatUKDate, formatUKDateTime } from "./utils";

interface BookingCardDetailsProps {
    timestamp: number;
    bookingType: "free" | "paid";
    isPaid: boolean;
    paymentTimestamp?: number;
}

export function BookingCardDetails({
    timestamp,
    bookingType,
    isPaid,
    paymentTimestamp,
}: BookingCardDetailsProps) {
    const durationMinutes = getBookingDurationMinutes(bookingType);

    return (
        <>
            {/* Date/Time - Simplified compact layout */}
            <div className="space-y-1.5 mb-4 text-sm">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="size-4 text-zinc-400 dark:text-zinc-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">
                        {formatUKDate(timestamp)}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-600">•</span>
                    <ClockIcon className="size-4 text-zinc-400 dark:text-zinc-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">
                        {formatBookingTimeRange(timestamp, bookingType)}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500 pl-6">
                    {durationMinutes} min · {bookingType === "free" ? "Free Trial" : "Paid Session"}
                </div>
            </div>

            {/* Payment Status */}
            {isPaid && paymentTimestamp && (
                <div className="mb-4 p-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <CheckIcon className="size-3.5" />
                        <span className="text-xs">
                            Paid on {formatUKDateTime(paymentTimestamp)}
                        </span>
                    </div>
                </div>
            )}
        </>
    );
}
