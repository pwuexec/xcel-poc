import { QueryCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { ACTIVE_STATUSES } from "../../types/bookingStatuses";

/**
 * Helper query to check booking eligibility between two users
 * Uses efficient index queries to minimize database reads and bandwidth
 * 
 * Business Rules:
 * 1. First booking between tutor-student must always be FREE
 * 2. Cannot have multiple active free bookings
 * 3. After completing a free meeting, only PAID bookings are allowed
 * 4. Free meetings can only be rebooked if they were CANCELED or REJECTED
 * 5. Cannot create paid bookings until the free meeting is completed
 */
export async function _getBookingEligibilityQuery(
    ctx: QueryCtx,
    args: {
        fromUserId: Id<"users">;
        toUserId: Id<"users">;
    }
) {
    // Check for active free bookings - use index to filter, avoiding .filter()
    // Check all active statuses in parallel
    const activeChecks = await Promise.all(
        ACTIVE_STATUSES.map(async (status) => {
            const [fromTo, toFrom] = await Promise.all([
                ctx.db
                    .query("bookings")
                    .withIndex("by_fromUserId_toUserId_bookingType_status", (q) =>
                        q.eq("fromUserId", args.fromUserId)
                         .eq("toUserId", args.toUserId)
                         .eq("bookingType", "free")
                         .eq("status", status)
                    )
                    .first(),
                ctx.db
                    .query("bookings")
                    .withIndex("by_toUserId_fromUserId_bookingType_status", (q) =>
                        q.eq("toUserId", args.fromUserId)
                         .eq("fromUserId", args.toUserId)
                         .eq("bookingType", "free")
                         .eq("status", status)
                    )
                    .first()
            ]);
            return fromTo || toFrom;
        })
    );

    if (activeChecks.some(result => result)) {
        return {
            canCreateFreeBooking: false,
            canCreatePaidBooking: false,
            hasActiveFreeBooking: true,
        };
    }

    // Check for completed free meeting
    const [completedFromTo, completedToFrom] = await Promise.all([
        ctx.db
            .query("bookings")
            .withIndex("by_fromUserId_toUserId_bookingType_status", (q) =>
                q.eq("fromUserId", args.fromUserId)
                 .eq("toUserId", args.toUserId)
                 .eq("bookingType", "free")
                 .eq("status", "completed")
            )
            .first(),
        ctx.db
            .query("bookings")
            .withIndex("by_toUserId_fromUserId_bookingType_status", (q) =>
                q.eq("toUserId", args.fromUserId)
                 .eq("fromUserId", args.toUserId)
                 .eq("bookingType", "free")
                 .eq("status", "completed")
            )
            .first()
    ]);

    if (completedFromTo || completedToFrom) {
        return {
            canCreateFreeBooking: false,
            canCreatePaidBooking: true,
            hasActiveFreeBooking: false,
        };
    }

    // Check for canceled/rejected free meetings
    const [canceledFromTo, canceledToFrom, rejectedFromTo, rejectedToFrom] = await Promise.all([
        ctx.db
            .query("bookings")
            .withIndex("by_fromUserId_toUserId_bookingType_status", (q) =>
                q.eq("fromUserId", args.fromUserId)
                 .eq("toUserId", args.toUserId)
                 .eq("bookingType", "free")
                 .eq("status", "canceled")
            )
            .first(),
        ctx.db
            .query("bookings")
            .withIndex("by_toUserId_fromUserId_bookingType_status", (q) =>
                q.eq("toUserId", args.fromUserId)
                 .eq("fromUserId", args.toUserId)
                 .eq("bookingType", "free")
                 .eq("status", "canceled")
            )
            .first(),
        ctx.db
            .query("bookings")
            .withIndex("by_fromUserId_toUserId_bookingType_status", (q) =>
                q.eq("fromUserId", args.fromUserId)
                 .eq("toUserId", args.toUserId)
                 .eq("bookingType", "free")
                 .eq("status", "rejected")
            )
            .first(),
        ctx.db
            .query("bookings")
            .withIndex("by_toUserId_fromUserId_bookingType_status", (q) =>
                q.eq("toUserId", args.fromUserId)
                 .eq("fromUserId", args.toUserId)
                 .eq("bookingType", "free")
                 .eq("status", "rejected")
            )
            .first()
    ]);

    if (canceledFromTo || canceledToFrom || rejectedFromTo || rejectedToFrom) {
        return {
            canCreateFreeBooking: true,
            canCreatePaidBooking: false,
            hasActiveFreeBooking: false,
        };
    }

    // No free bookings exist at all - this is the first booking
    return {
        canCreateFreeBooking: true,
        canCreatePaidBooking: false,
        hasActiveFreeBooking: false,
    };
}
