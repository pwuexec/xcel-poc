import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { _ensureBookingAccess } from "../_ensureBookingAccess";
import { _addBookingEvent } from "../_addBookingEvent";

export async function _cancelBookingMutation(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
        reason?: string;
    }
) {
    const booking = await _ensureBookingAccess(ctx, args.bookingId, args.userId);

    // Can only cancel bookings that are not already completed or canceled
    if (booking.status === "completed" || booking.status === "canceled") {
        throw new Error("Cannot cancel a completed or already canceled booking");
    }

    await ctx.db.patch(args.bookingId, {
        status: "canceled",
    });

    // Add cancellation event
    await _addBookingEvent(ctx, args.bookingId, args.userId, "canceled", {
        reason: args.reason,
    });
}
