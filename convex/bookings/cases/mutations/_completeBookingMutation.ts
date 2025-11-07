import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { _addBookingEventMutation } from "./_addBookingEventMutation";
import { _ensureBookingAccess } from "../_ensureBookingAccess";

/**
 * User-initiated booking completion
 * Allows a tutor to manually mark a booking as completed
 */
export async function _completeBookingMutation(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
    }
) {
    const booking = await _ensureBookingAccess(ctx, args.bookingId, args.userId);

    // Only mark as completed if it's currently confirmed
    if (booking.status !== "confirmed") {
        throw new Error("Can only complete confirmed bookings");
    }

    // Verify that the user is the tutor (toUserId)
    if (booking.toUserId !== args.userId) {
        throw new Error("Only the tutor can manually complete a booking");
    }

    // Update status to completed
    await ctx.db.patch(args.bookingId, {
        status: "completed",
    });

    // Add completion event
    await _addBookingEventMutation(ctx, args.bookingId, args.userId, "completed", {
        completedAt: Date.now(),
    });
}
