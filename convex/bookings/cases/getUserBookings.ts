import { QueryCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { getUserByIdOrThrow } from "../../users/cases/queries/_getCurrentUserQuery";
import { _isRole } from "../../users/cases/_isRole";
import { BookingEvent } from "../types/bookingEvents";

export async function getUserBookings(
    ctx: QueryCtx,
    userId: Id<"users">
) {
    const currentUser = await getUserByIdOrThrow(ctx, userId);
    const isTutor = _isRole(currentUser, "tutor");

    // Use new indexes
    const indexName = isTutor ? "by_toUserId_timestamp" : "by_fromUserId_timestamp";
    const fieldName = isTutor ? "toUserId" : "fromUserId";

    const bookings = await ctx.db.query("bookings")
        .withIndex(indexName, (q) => q.eq(fieldName, userId))
        .order("desc")
        .collect();

    // Enrich bookings with user info
    const bookingsWithUsers = await Promise.all(bookings.map(async (booking) => {
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

        return {
            booking: {
                ...booking,
                events: eventsWithUsers,
            },
            toUser,
            fromUser,
            currentUser
        };
    }));

    return bookingsWithUsers;
}
