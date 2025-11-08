import { QueryCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { BookingType } from "../types/bookingType";
import { getBookingDurationMs } from "../utils";

/**
 * Validates that a booking timestamp is valid:
 * 1. Not in the past
 * 2. No time conflicts with existing bookings for either user
 * 3. No time conflicts with recurring booking rules (tutors can't accept bookings during recurring slots)
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
        skipRecurringRuleCheck?: boolean; // For creating recurring bookings themselves
    }
) {
    // 1. Validate that the booking timestamp is not in the past (UTC comparison)
    const nowUTC = Date.now();
    if (args.timestamp <= nowUTC) {
        throw new Error(
            "Cannot create a booking in the past. Please select a future date and time."
        );
    }

    // 2. Check for recurring rule conflicts (tutors can't have bookings during their recurring slots)
    if (!args.skipRecurringRuleCheck) {
        const allRecurringRules = await ctx.db.query("recurringRules").collect();
        
        // Filter active recurring rules that involve either user
        const relevantRules = allRecurringRules.filter((rule) => {
            if (rule.status !== "active") return false;
            
            // Check if rule involves either user
            return rule.fromUserId === args.fromUserId || rule.toUserId === args.fromUserId ||
                   rule.fromUserId === args.toUserId || rule.toUserId === args.toUserId;
        });

        // Check if the booking timestamp conflicts with any recurring rule
        for (const rule of relevantRules) {
            const bookingDate = new Date(args.timestamp);
            const bookingDayOfWeek = bookingDate.getUTCDay();
            const bookingHourUTC = bookingDate.getUTCHours();
            const bookingMinuteUTC = bookingDate.getUTCMinutes();
            
            // Convert day number to day name
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const bookingDayName = dayNames[bookingDayOfWeek];
            
            // Check if this booking falls on the same day of week and time as the recurring rule
            if (rule.dayOfWeek === bookingDayName && 
                rule.hourUTC === bookingHourUTC && 
                rule.minuteUTC === bookingMinuteUTC) {
                
                // Determine which user has the conflict
                const conflictUser = 
                    rule.fromUserId === args.fromUserId || rule.toUserId === args.fromUserId
                        ? "You"
                        : "The other user";
                
                // Format recurring rule time in UK timezone
                const ruleTime = new Date();
                ruleTime.setUTCHours(rule.hourUTC, rule.minuteUTC, 0, 0);
                const ruleTimeStr = ruleTime.toLocaleTimeString("en-GB", {
                    timeZone: "Europe/London",
                    hour: "2-digit",
                    minute: "2-digit",
                });
                
                throw new Error(
                    `${conflictUser} have a recurring booking every ${rule.dayOfWeek} at ${ruleTimeStr}. ` +
                    `This time slot is reserved for recurring sessions. ` +
                    `Please choose a different time.`
                );
            }
        }
    }

    // 3. Check for time conflicts with existing bookings (all in UTC)
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

        // Only check active bookings (rejected and canceled bookings free up the time slot)
        if (!["pending", "awaiting_reschedule", "confirmed", "awaiting_payment", "processing_payment"].includes(booking.status)) {
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
