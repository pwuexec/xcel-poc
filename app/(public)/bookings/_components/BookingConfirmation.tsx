"use client";

import { CalendarCheckIcon, InfoIcon } from "lucide-react";
import { formatBookingDateTime, formatTimeRange } from "./utils";
import { getBookingDurationMinutes, getBookingEndTime } from "@/convex/bookings/utils";
import { EARLY_JOIN_MINUTES } from "@/convex/bookings/constants";

interface BookingConfirmationProps {
    selectedDate: Date;
    time: string;
    bookingType: "free" | "paid";
    isReschedule?: boolean;
}

export function BookingConfirmation({
    selectedDate,
    time,
    bookingType,
    isReschedule = false,
}: BookingConfirmationProps) {
    const durationMinutes = getBookingDurationMinutes(bookingType);
    
    // Calculate times
    const timeWithoutSeconds = time.substring(0, 5); // "HH:MM:SS" -> "HH:MM"
    const [hours, minutes] = timeWithoutSeconds.split(':').map(Number);
    
    // Format times in 12-hour format
    const format12Hour = (h: number, m: number) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
    };
    
    // Calculate end time
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    
    // Calculate early join time (10 minutes before)
    const earlyJoinTotalMinutes = hours * 60 + minutes - EARLY_JOIN_MINUTES;
    const earlyJoinHours = Math.floor(earlyJoinTotalMinutes / 60);
    const earlyJoinMinutes = earlyJoinTotalMinutes % 60;
    
    const startTime = format12Hour(hours, minutes);
    const endTime = format12Hour(endHours, endMinutes);
    const earlyJoinTime = format12Hour(earlyJoinHours, earlyJoinMinutes);

    return (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-full">
                    <CalendarCheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 space-y-3">
                    <div>
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            {isReschedule ? 'Booking will be rescheduled' : 'Booking will be scheduled'}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            📅 {formatBookingDateTime(selectedDate, time)}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 min-w-[80px]">
                                Starts at:
                            </span>
                            <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
                                {startTime}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 min-w-[80px]">
                                Ends at:
                            </span>
                            <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
                                {endTime}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 min-w-[80px]">
                                Duration:
                            </span>
                            <span className="text-sm text-blue-700 dark:text-blue-300">
                                {durationMinutes} minutes
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-2.5 bg-blue-100/50 dark:bg-blue-800/30 rounded-md border border-blue-200 dark:border-blue-700">
                        <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                <span className="font-semibold">You can join {EARLY_JOIN_MINUTES} minutes early</span>
                                <br />
                                Available from <span className="font-medium">{earlyJoinTime}</span>
                            </p>
                        </div>
                    </div>

                    <p className="text-xs text-blue-600 dark:text-blue-400">
                        All times in UK timezone (Europe/London)
                    </p>
                </div>
            </div>
        </div>
    );
}
