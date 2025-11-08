import { BookingType } from "../types/bookingType";
import { getBookingDurationMs } from "../utils";

/**
 * Get the duration of a booking in milliseconds based on booking type
 * - Free meetings: 15 minutes
 * - Paid bookings: 60 minutes (1 hour)
 * 
 * @deprecated Use getBookingDurationMs from ../utils instead
 */
export function getBookingDuration(bookingType: BookingType): number {
    return getBookingDurationMs(bookingType);
}
