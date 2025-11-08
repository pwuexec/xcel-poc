"use client";

import { CalendarIcon, ClockIcon, UserIcon, TimerIcon } from "lucide-react";
import { formatUKDate } from "../../_components/utils";
import { getBookingDurationMinutes } from "@/convex/bookings/utils";

interface BookingPreviewProps {
    selectedDate: Date;
    selectedTime: string;
    userName: string;
    userRole: "tutor" | "student";
    bookingType: "free" | "paid";
}

export function BookingPreview({
    selectedDate,
    selectedTime,
    userName,
    userRole,
    bookingType,
}: BookingPreviewProps) {
    // Format time for display (remove seconds)
    const formatTime = (time: string) => time.substring(0, 5);

    // Create a timestamp for formatting
    const [hours, minutes] = selectedTime.split(":");
    const tempDate = new Date(selectedDate);
    tempDate.setHours(parseInt(hours), parseInt(minutes), 0);

    // Calculate duration and end time
    const durationMinutes = getBookingDurationMinutes(bookingType);
    const endDate = new Date(tempDate.getTime() + durationMinutes * 60 * 1000);
    const endTime = endDate.toLocaleTimeString('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    return (
        <div className="mb-4">
            <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800 p-3 sm:p-4">
                <div className="space-y-2.5">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400">
                        Booking Preview
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm">
                        <UserIcon className="size-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                            {userRole === "tutor" ? "Tutor" : "Student"}:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {userName}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="size-4 text-gray-600 dark:text-gray-400" />
                        <span className="font-semibold text-green-900 dark:text-green-100">
                            {formatUKDate(tempDate.getTime())}
                        </span>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm">
                            <ClockIcon className="size-4 text-gray-600 dark:text-gray-400" />
                            <span className="font-semibold text-green-900 dark:text-green-100">
                                {formatTime(selectedTime)} - {endTime}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs pl-6">
                            <TimerIcon className="size-3.5 text-green-600 dark:text-green-400" />
                            <span className="text-green-700 dark:text-green-300">
                                {durationMinutes} minutes session
                            </span>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-green-700 dark:text-green-300">
                                Session Type
                            </span>
                            <span className={`font-medium px-2 py-0.5 rounded ${
                                bookingType === "paid" 
                                    ? "bg-green-600 text-white" 
                                    : "bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100"
                            }`}>
                                {bookingType === "paid" ? "Paid" : "Free Trial"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
