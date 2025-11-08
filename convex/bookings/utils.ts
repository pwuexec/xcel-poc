import { BookingType } from "./types/bookingType";

/**
 * Shared utilities for booking information
 * These functions are used by both frontend and backend
 */

/**
 * Get the duration of a booking in minutes based on booking type
 * - Free meetings: 15 minutes
 * - Paid sessions: 60 minutes
 */
export function getBookingDurationMinutes(bookingType: BookingType): number {
    return bookingType === "free" ? 15 : 60;
}

/**
 * Get the duration of a booking in milliseconds based on booking type
 * - Free meetings: 15 minutes
 * - Paid sessions: 60 minutes
 */
export function getBookingDurationMs(bookingType: BookingType): number {
    return getBookingDurationMinutes(bookingType) * 60 * 1000;
}

/**
 * Get the end timestamp for a booking
 */
export function getBookingEndTime(startTimestamp: number, bookingType: BookingType): number {
    return startTimestamp + getBookingDurationMs(bookingType);
}

/**
 * Format booking times as a readable string
 * @param startTimestamp - Start time in UTC milliseconds
 * @param bookingType - Type of booking (free or paid)
 * @returns Formatted time range string
 */
export function formatBookingTimeRange(startTimestamp: number, bookingType: BookingType): string {
    const start = new Date(startTimestamp);
    const end = new Date(getBookingEndTime(startTimestamp, bookingType));
    
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-GB', {
            timeZone: 'Europe/London',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };
    
    return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Get a friendly description for a booking type
 */
export function getBookingTypeDescription(bookingType: BookingType): string {
    if (bookingType === "free") {
        return "First session is on the house! Get to know your tutor with a complimentary 15-minute introduction.";
    }
    return "1-hour tutoring session";
}

/**
 * Get booking type info object with all details
 */
export function getBookingTypeInfo(bookingType: BookingType) {
    return {
        type: bookingType,
        durationMinutes: getBookingDurationMinutes(bookingType),
        durationMs: getBookingDurationMs(bookingType),
        description: getBookingTypeDescription(bookingType),
        isFree: bookingType === "free",
    };
}
