import { MutationCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { BookingEvent } from "../types/bookingEvents";

export async function _addBookingEvent(
    ctx: MutationCtx,
    bookingId: Id<"bookings">,
    userId: Id<"users">,
    eventType: BookingEvent["type"],
    metadata: BookingEvent["metadata"]
) {
    const booking = await ctx.db.get(bookingId);
    if (!booking) {
        throw new Error("Booking not found");
    }

    const newEvent: BookingEvent = {
        timestamp: Date.now(),
        userId,
        type: eventType,
        metadata,
    };

    await ctx.db.patch(bookingId, {
        events: [...booking.events, newEvent],
        lastActionByUserId: userId,
    });

    return newEvent;
}
