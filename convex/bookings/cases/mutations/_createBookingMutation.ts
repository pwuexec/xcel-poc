import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { BookingType } from "../../types/bookingType";
import { ACTIVE_STATUSES } from "../../types/bookingStatuses";
import { BOOKING_ERRORS } from "../../../constants/errors";
import { _validateTutorStudentRelationship } from "../_validateTutorStudentRelationship";
import { _addBookingEvent } from "../_addBookingEvent";

export async function _createBookingMutation(
    ctx: MutationCtx,
    args: {
        fromUserId: Id<"users">;
        toUserId: Id<"users">;
        timestamp: number;
    }
) {
    await _validateTutorStudentRelationship(ctx, args.fromUserId, args.toUserId);

    // Query bookings in both directions using indexes
    const bookingsFromTo = await ctx.db
        .query("bookings")
        .withIndex("by_fromUserId_toUserId", (q) =>
            q.eq("fromUserId", args.fromUserId).eq("toUserId", args.toUserId)
        )
        .collect();

    const bookingsToFrom = await ctx.db
        .query("bookings")
        .withIndex("by_toUserId_fromUserId", (q) =>
            q.eq("toUserId", args.fromUserId).eq("fromUserId", args.toUserId)
        )
        .collect();

    const existingBookings = [...bookingsFromTo, ...bookingsToFrom];

    // Check if there's an active free meeting (pending, awaiting_reschedule, awaiting_payment, processing_payment, or confirmed)
    const activeFreeBooking = existingBookings.find(
        (booking) =>
            booking.bookingType === "free" &&
            (ACTIVE_STATUSES as readonly string[]).includes(booking.status)
    );

    if (activeFreeBooking) {
        throw new Error(BOOKING_ERRORS.FREE_MEETING_ACTIVE);
    }

    // Determine booking type
    // If there are no existing bookings, it's free
    // If there's a cancelled free booking, the new one is still free
    const hasCancelledFreeBooking = existingBookings.some(
        (booking) => booking.bookingType === "free" && booking.status === "canceled"
    );
    
    const isFirstBooking = existingBookings.length === 0;
    const bookingTypeValue: BookingType = (isFirstBooking || hasCancelledFreeBooking) ? "free" : "paid";

    const bookingId = await ctx.db.insert("bookings", {
        fromUserId: args.fromUserId,
        toUserId: args.toUserId,
        timestamp: args.timestamp,
        status: "pending",
        bookingType: bookingTypeValue,
        events: [],
        lastActionByUserId: args.fromUserId,
    });

    // Add creation event
    await _addBookingEvent(ctx, bookingId, args.fromUserId, "created", {
        scheduledTime: args.timestamp,
    });

    return bookingId;
}
