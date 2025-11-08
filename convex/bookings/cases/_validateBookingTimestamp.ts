import { QueryCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { BookingType } from "../types/bookingType";
import { getBookingDurationMs } from "../utils";

/**
 * Validates that a booking timestamp is valid:
 * 1. Not in the past
 * 2. No time conflicts with existing bookings for either user
 * 
 * Server works in UTC - all timestamps are in UTC
 * Frontend sends UTC timestamps, server validates in UTC
 * Only formatting for error messages uses UK timezone
 * 
 * This helper is used by both createBooking and rescheduleBooking
 */
export async function _validateBookingTimestamp(
    ctx: QueryCtx,
    args: {
        timestamp: number; // UTC timestamp
        fromUserId: Id<"users">;
        toUserId: Id<"users">;
        bookingType: BookingType;
        excludeBookingId?: Id<"bookings">; // For reschedule, exclude the current booking
    }
) {
    // 1. Validate that the booking timestamp is not in the past (UTC comparison)
    const nowUTC = Date.now();
    if (args.timestamp <= nowUTC) {
        throw new Error(
            "Cannot create a booking in the past. Please select a future date and time."
        );
    }

    // 2. Check for time conflicts (all in UTC)
    const duration = getBookingDurationMs(args.bookingType);
    const bookingStart = args.timestamp; // UTC
    const bookingEnd = args.timestamp + duration; // UTC

    // Get all active bookings for both users
    const allBookings = await ctx.db.query("bookings").collect();

    // Filter bookings that involve either user and are not cancelled/rejected
    const relevantBookings = allBookings.filter((booking) => {
        // Exclude the current booking if rescheduling
        if (args.excludeBookingId && booking._id === args.excludeBookingId) {
            return false;
        }

        // Only check bookings that are pending, accepted, or completed
        if (!["pending", "accepted", "completed"].includes(booking.status)) {
            return false;
        }

        // Check if booking involves either user
        const involvesFromUser = 
            booking.fromUserId === args.fromUserId || booking.toUserId === args.fromUserId;
        const involvesToUser = 
            booking.fromUserId === args.toUserId || booking.toUserId === args.toUserId;

        return involvesFromUser || involvesToUser;
    });

    // Check for time conflicts (UTC comparisons)
    for (const booking of relevantBookings) {
        const existingDuration = getBookingDurationMs(booking.bookingType);
        const existingStart = booking.timestamp; // UTC
        const existingEnd = booking.timestamp + existingDuration; // UTC

        // Check if time ranges overlap (all UTC timestamps)
        const hasOverlap = 
            (bookingStart >= existingStart && bookingStart < existingEnd) || // New booking starts during existing
            (bookingEnd > existingStart && bookingEnd <= existingEnd) ||     // New booking ends during existing
            (bookingStart <= existingStart && bookingEnd >= existingEnd);    // New booking contains existing

        if (hasOverlap) {
            // Determine which user has the conflict
            const conflictUser = 
                booking.fromUserId === args.fromUserId || booking.toUserId === args.fromUserId
                    ? "You"
                    : "The other user";

            // Format error message in UK timezone for user display
            const conflictTime = new Date(existingStart).toLocaleString("en-GB", {
                timeZone: "Europe/London",
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });

            throw new Error(
                `${conflictUser} already have a booking at this time. ` +
                `Existing booking: ${conflictTime}. ` +
                `Please choose a different time.`
            );
        }
    }
}
