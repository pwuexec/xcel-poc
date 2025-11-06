import { QueryCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";

/**
 * Helper query to check booking eligibility between two users
 * Uses efficient index queries to minimize database reads
 */
export async function _getBookingEligibilityQuery(
    ctx: QueryCtx,
    args: {
        fromUserId: Id<"users">;
        toUserId: Id<"users">;
    }
) {
    // Check for active free meeting (from -> to)
    const activeFreeFromTo = await ctx.db
        .query("bookings")
        .withIndex("by_fromUserId_toUserId", (q) =>
            q.eq("fromUserId", args.fromUserId).eq("toUserId", args.toUserId)
        )
        .filter((q) => 
            q.and(
                q.eq(q.field("bookingType"), "free"),
                q.or(
                    q.eq(q.field("status"), "pending"),
                    q.eq(q.field("status"), "awaiting_reschedule"),
                    q.eq(q.field("status"), "awaiting_payment"),
                    q.eq(q.field("status"), "processing_payment"),
                    q.eq(q.field("status"), "confirmed")
                )
            )
        )
        .first();

    // Check for active free meeting (to -> from)
    const activeFreeToFrom = await ctx.db
        .query("bookings")
        .withIndex("by_toUserId_fromUserId", (q) =>
            q.eq("toUserId", args.fromUserId).eq("fromUserId", args.toUserId)
        )
        .filter((q) => 
            q.and(
                q.eq(q.field("bookingType"), "free"),
                q.or(
                    q.eq(q.field("status"), "pending"),
                    q.eq(q.field("status"), "awaiting_reschedule"),
                    q.eq(q.field("status"), "awaiting_payment"),
                    q.eq(q.field("status"), "processing_payment"),
                    q.eq(q.field("status"), "confirmed")
                )
            )
        )
        .first();

    const hasActiveFreeBooking = !!(activeFreeFromTo || activeFreeToFrom);

    // If there's an active free meeting, we can return early
    if (hasActiveFreeBooking) {
        return {
            canCreateFreeBooking: false,
            canCreatePaidBooking: false,
            hasActiveFreeBooking: true,
            hasCompletedFreeMeeting: false,
            isFirstBooking: false,
        };
    }

    // Check for completed free meeting (from -> to)
    const completedFreeFromTo = await ctx.db
        .query("bookings")
        .withIndex("by_fromUserId_toUserId", (q) =>
            q.eq("fromUserId", args.fromUserId).eq("toUserId", args.toUserId)
        )
        .filter((q) => 
            q.and(
                q.eq(q.field("bookingType"), "free"),
                q.eq(q.field("status"), "completed")
            )
        )
        .first();

    // Check for completed free meeting (to -> from)
    const completedFreeToFrom = await ctx.db
        .query("bookings")
        .withIndex("by_toUserId_fromUserId", (q) =>
            q.eq("toUserId", args.fromUserId).eq("fromUserId", args.toUserId)
        )
        .filter((q) => 
            q.and(
                q.eq(q.field("bookingType"), "free"),
                q.eq(q.field("status"), "completed")
            )
        )
        .first();

    const hasCompletedFreeMeeting = !!(completedFreeFromTo || completedFreeToFrom);

    // If there's a completed free meeting, user can create paid bookings
    if (hasCompletedFreeMeeting) {
        return {
            canCreateFreeBooking: true, // Can still do another free meeting if they want
            canCreatePaidBooking: true,
            hasActiveFreeBooking: false,
            hasCompletedFreeMeeting: true,
            isFirstBooking: false,
        };
    }

    // Check for cancelled/rejected free meeting (from -> to)
    const cancelledFreeFromTo = await ctx.db
        .query("bookings")
        .withIndex("by_fromUserId_toUserId", (q) =>
            q.eq("fromUserId", args.fromUserId).eq("toUserId", args.toUserId)
        )
        .filter((q) => 
            q.and(
                q.eq(q.field("bookingType"), "free"),
                q.or(
                    q.eq(q.field("status"), "canceled"),
                    q.eq(q.field("status"), "rejected")
                )
            )
        )
        .first();

    // Check for cancelled/rejected free meeting (to -> from)
    const cancelledFreeToFrom = await ctx.db
        .query("bookings")
        .withIndex("by_toUserId_fromUserId", (q) =>
            q.eq("toUserId", args.fromUserId).eq("fromUserId", args.toUserId)
        )
        .filter((q) => 
            q.and(
                q.eq(q.field("bookingType"), "free"),
                q.or(
                    q.eq(q.field("status"), "canceled"),
                    q.eq(q.field("status"), "rejected")
                )
            )
        )
        .first();

    const hasCancelledOrRejectedFreeBooking = !!(cancelledFreeFromTo || cancelledFreeToFrom);
    if (hasCancelledOrRejectedFreeBooking) {
        return {
            canCreateFreeBooking: true,
            canCreatePaidBooking: false,
            hasActiveFreeBooking: false,
            hasCompletedFreeMeeting: false,
            isFirstBooking: false,
        };
    }

    // Check if any booking exists at all (from -> to)
    const anyBookingFromTo = await ctx.db
        .query("bookings")
        .withIndex("by_fromUserId_toUserId", (q) =>
            q.eq("fromUserId", args.fromUserId).eq("toUserId", args.toUserId)
        )
        .first();

    // Check if any booking exists at all (to -> from)
    const anyBookingToFrom = await ctx.db
        .query("bookings")
        .withIndex("by_toUserId_fromUserId", (q) =>
            q.eq("toUserId", args.fromUserId).eq("fromUserId", args.toUserId)
        )
        .first();

    const isFirstBooking = !anyBookingFromTo && !anyBookingToFrom;

    // First booking - only free is allowed
    return {
        canCreateFreeBooking: isFirstBooking,
        canCreatePaidBooking: false,
        hasActiveFreeBooking: false,
        hasCompletedFreeMeeting: false,
        isFirstBooking: true,
    };
}
