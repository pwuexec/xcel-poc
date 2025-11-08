import { QueryCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { PaginationOptions } from "convex/server";
import { getUserByIdOrThrow } from "../../../users/cases/queries/_getCurrentUserQuery";
import { _isRole } from "../../../users/cases/_isRole";
import { BookingEvent } from "../../types/bookingEvents";
import { ACTIVE_STATUSES, PAST_STATUSES } from "../../types/bookingStatuses";
import { formatUserNameGDPR } from "../../../users/cases/_formatUserNameGDPR";

export async function _getUserBookingsPaginatedQuery(
    ctx: QueryCtx,
    args: {
        userId: Id<"users">;
        paginationOpts: PaginationOptions;
        statuses?: string[];
        includeCounts?: boolean; // New parameter to optionally include counts
    }
) {
    const currentUser = await getUserByIdOrThrow(ctx, args.userId);
    const isTutor = _isRole(currentUser, "tutor");

    const indexName = isTutor ? "by_toUserId_timestamp" : "by_fromUserId_timestamp";
    const fieldName = isTutor ? "toUserId" : "fromUserId";

    let query = ctx.db.query("bookings")
        .withIndex(indexName, (q) => q.eq(fieldName, args.userId))
        .order("desc");

    // Filter by statuses if provided
    if (args.statuses && args.statuses.length > 0) {
        query = query.filter((q) => {
            let condition = q.eq(q.field("status"), args.statuses![0]);
            for (let i = 1; i < args.statuses!.length; i++) {
                condition = q.or(condition, q.eq(q.field("status"), args.statuses![i]));
            }
            return condition;
        });
    }

    const paginationResult = await query.paginate(args.paginationOpts);

    // Enrich bookings with user info and unread message count
    const enrichedPage = await Promise.all(paginationResult.page.map(async (booking) => {
        const toUser = await getUserByIdOrThrow(ctx, booking.toUserId);
        const fromUser = await getUserByIdOrThrow(ctx, booking.fromUserId);

        // Fetch user info for all events
        const eventsWithUsers = await Promise.all(booking.events.map(async (event: BookingEvent) => {
            const eventUser = await getUserByIdOrThrow(ctx, event.userId);
            return {
                ...event,
                userName: formatUserNameGDPR(eventUser.name) || eventUser.email || "Unknown User",
            };
        }));

        // Get unread message count for this booking
        const messages = await ctx.db
            .query("messages")
            .withIndex("bookingId", (q) => q.eq("bookingId", booking._id))
            .collect();

        const unreadCount = messages.filter((message) => !message.readBy.includes(args.userId)).length;

        return {
            booking: {
                ...booking,
                events: eventsWithUsers,
            },
            toUser: {
                ...toUser,
                name: formatUserNameGDPR(toUser.name),
            },
            fromUser: {
                ...fromUser,
                name: formatUserNameGDPR(fromUser.name),
            },
            currentUser,
            unreadCount
        };
    }));

    // Optionally calculate counts efficiently using the same base query
    let counts = undefined;
    if (args.includeCounts) {
        // We need to query without pagination to get counts
        // But we only fetch the status field, not full booking data
        const allBookings = await ctx.db.query("bookings")
            .withIndex(indexName, (q) => q.eq(fieldName, args.userId))
            .collect();

        const pendingStatuses = ["pending", "awaiting_reschedule"];
        
        counts = {
            active: allBookings.filter(b => ACTIVE_STATUSES.includes(b.status as any)).length,
            past: allBookings.filter(b => PAST_STATUSES.includes(b.status as any)).length,
            pending: allBookings.filter(b => pendingStatuses.includes(b.status)).length,
        };
    }

    return {
        ...paginationResult,
        page: enrichedPage,
        counts,
    };
}
