import { BookingType } from "../types/bookingType";

/**
 * Get the duration of a booking in milliseconds based on booking type
 * - Free meetings: 15 minutes
 * - Paid bookings: 60 minutes (1 hour)
 */
export function getBookingDuration(bookingType: BookingType): number {
    if (bookingType === "free") {
        return 15 * 60 * 1000; // 15 minutes
    }
    return 60 * 60 * 1000; // 1 hour
}
