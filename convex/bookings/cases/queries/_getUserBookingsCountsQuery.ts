import { QueryCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { getUserByIdOrThrow } from "../../../users/cases/queries/_getCurrentUserQuery";
import { _isRole } from "../../../users/cases/_isRole";
import { ACTIVE_STATUSES, PAST_STATUSES } from "../../../bookings/types/bookingStatuses";

/**
 * Optimized query to count bookings without fetching all booking data
 * Uses efficient filtering to count only what's needed
 */
export async function _getUserBookingsCountsQuery(
    ctx: QueryCtx,
    userId: Id<"users">
) {
    const currentUser = await getUserByIdOrThrow(ctx, userId);
    const isTutor = _isRole(currentUser, "tutor");

    const indexName = isTutor ? "by_toUserId_timestamp" : "by_fromUserId_timestamp";
    const fieldName = isTutor ? "toUserId" : "fromUserId";

    // Count active bookings efficiently
    const activeBookings = await ctx.db.query("bookings")
        .withIndex(indexName, (q) => q.eq(fieldName, userId))
        .filter((q) => {
            let condition = q.eq(q.field("status"), ACTIVE_STATUSES[0]);
            for (let i = 1; i < ACTIVE_STATUSES.length; i++) {
                condition = q.or(condition, q.eq(q.field("status"), ACTIVE_STATUSES[i]));
            }
            return condition;
        })
        .collect();

    // Count past bookings efficiently
    const pastBookings = await ctx.db.query("bookings")
        .withIndex(indexName, (q) => q.eq(fieldName, userId))
        .filter((q) => {
            let condition = q.eq(q.field("status"), PAST_STATUSES[0]);
            for (let i = 1; i < PAST_STATUSES.length; i++) {
                condition = q.or(condition, q.eq(q.field("status"), PAST_STATUSES[i]));
            }
            return condition;
        })
        .collect();

    // Count pending bookings efficiently
    const pendingBookings = await ctx.db.query("bookings")
        .withIndex(indexName, (q) => q.eq(fieldName, userId))
        .filter((q) => 
            q.or(
                q.eq(q.field("status"), "pending"),
                q.eq(q.field("status"), "awaiting_reschedule")
            )
        )
        .collect();

    return {
        active: activeBookings.length,
        past: pastBookings.length,
        pending: pendingBookings.length,
    };
}
