"use client";

import { ArrowRightIcon, CalendarIcon, ClockIcon } from "lucide-react";
import { formatUKDate, formatUKTime } from "../../_components/utils";

interface RescheduleComparisonProps {
    currentTimestamp: number;
    newDate: Date;
    newTime: string;
    bookingType: "free" | "paid";
}

export function RescheduleComparison({
    currentTimestamp,
    newDate,
    newTime,
    bookingType,
}: RescheduleComparisonProps) {
    const currentDate = new Date(currentTimestamp);
    const currentUkTime = currentDate.toLocaleTimeString('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    // Check if times are actually different
    const selectedDateStr = newDate.toISOString().split('T')[0];
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const isTimeChanged = selectedDateStr !== currentDateStr || newTime !== currentUkTime;

    if (!isTimeChanged) {
        return null; // Don't show if nothing changed
    }

    // Format time for display (remove seconds)
    const formatTime = (time: string) => time.substring(0, 5);

    return (
        <div className="mb-4 sm:mb-6">
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                    {/* Current Time */}
                    <div className="flex-1">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Current</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <CalendarIcon className="size-3.5" />
                            <span>{formatUKDate(currentTimestamp)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                            <ClockIcon className="size-3.5" />
                            <span>{formatUKTime(currentTimestamp)}</span>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="shrink-0">
                        <ArrowRightIcon className="size-5 text-blue-600 dark:text-blue-400" />
                    </div>

                    {/* New Time */}
                    <div className="flex-1 text-right">
                        <p className="text-xs text-green-600 dark:text-green-400 mb-1">Rescheduled to</p>
                        <div className="flex items-center justify-end gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <span>{formatUKDate(newDate.getTime())}</span>
                            <CalendarIcon className="size-3.5" />
                        </div>
                        <div className="flex items-center justify-end gap-1.5 text-sm font-semibold text-green-900 dark:text-green-100">
                            <span>{formatTime(newTime)}</span>
                            <ClockIcon className="size-3.5" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
