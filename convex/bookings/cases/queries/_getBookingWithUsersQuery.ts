import { QueryCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { getUserByIdOrThrow } from "../../../model/users";
import { BookingEvent } from "../../types/bookingEvents";
import { _getBookingOrThrow } from "../_getBookingOrThrow";

export async function _getBookingWithUsersQuery(
    ctx: QueryCtx,
    bookingId: Id<"bookings">
) {
    const booking = await _getBookingOrThrow(ctx, bookingId);

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
    };
}
