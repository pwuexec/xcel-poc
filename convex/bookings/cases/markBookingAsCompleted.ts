import { MutationCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { _addBookingEvent } from "./_addBookingEvent";

export async function markBookingAsCompleted(
    ctx: MutationCtx,
    bookingId: Id<"bookings">
) {
    const booking = await ctx.db.get(bookingId);
    if (!booking) {
        return null; // Booking no longer exists
    }

    // Only mark as completed if it's currently confirmed
    if (booking.status !== "confirmed") {
        return null;
    }

    // Update status to completed
    await ctx.db.patch(bookingId, {
        status: "completed",
    });

    // Add completion event - use the tutor's ID as the actor
    await _addBookingEvent(ctx, bookingId, booking.toUserId, "completed", {
        completedAt: Date.now(),
    });

    return booking;
}
