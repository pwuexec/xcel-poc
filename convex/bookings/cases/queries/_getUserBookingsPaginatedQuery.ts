import { QueryCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { PaginationOptions } from "convex/server";
import { getUserByIdOrThrow, isRole } from "../../../model/users";
import { BookingEvent } from "../../types/bookingEvents";

export async function _getUserBookingsPaginatedQuery(
    ctx: QueryCtx,
    args: {
        userId: Id<"users">;
        paginationOpts: PaginationOptions;
        statuses?: string[];
    }
) {
    const currentUser = await getUserByIdOrThrow(ctx, args.userId);
    const isTutor = isRole(currentUser, "tutor");

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
                userName: eventUser.name || eventUser.email || "Unknown User",
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
            toUser,
            fromUser,
            currentUser,
            unreadCount
        };
    }));

    return {
        ...paginationResult,
        page: enrichedPage,
    };
}
