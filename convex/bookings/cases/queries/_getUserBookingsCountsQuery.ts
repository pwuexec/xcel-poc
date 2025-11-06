import { QueryCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { getUserByIdOrThrow, isRole } from "../.././../model/users";
import { ACTIVE_STATUSES, ActiveStatusFilter, PAST_STATUSES, PastStatusFilter } from "../../../bookings/types/bookingStatuses";

export async function _getUserBookingsCountsQuery(
    ctx: QueryCtx,
    userId: Id<"users">
) {
    const currentUser = await getUserByIdOrThrow(ctx, userId);
    const isTutor = isRole(currentUser, "tutor");

    const indexName = isTutor ? "by_toUserId_timestamp" : "by_fromUserId_timestamp";
    const fieldName = isTutor ? "toUserId" : "fromUserId";

    const bookings = await ctx.db.query("bookings")
        .withIndex(indexName, (q) => q.eq(fieldName, userId))
        .collect();

    const pendingStatuses = ["pending", "awaiting_reschedule"] as const;

    const counts = {
        active: 0,
        past: 0,
        pending: 0,
    };

    bookings.forEach((booking) => {
        if (ACTIVE_STATUSES.includes(booking.status as ActiveStatusFilter)) {
            counts.active++;
        }
        if (PAST_STATUSES.includes(booking.status as PastStatusFilter)) {
            counts.past++;
        }
        if (pendingStatuses.includes(booking.status as typeof pendingStatuses[number])) {
            counts.pending++;
        }
    });

    return counts;
}
