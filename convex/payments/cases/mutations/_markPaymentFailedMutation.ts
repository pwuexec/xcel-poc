import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { _addBookingEvent } from "../../../bookings/cases/_addBookingEvent";
import { _getBookingOrThrow } from "../../../bookings/cases/_getBookingOrThrow";

/**
 * Helper mutation to mark payment as failed
 * Updates booking status back to awaiting_payment and records the failure event
 */
export async function _markPaymentFailedMutation(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
        reason?: string;
    }
) {
    const booking = await _getBookingOrThrow(ctx, args.bookingId);

    // Update booking status back to awaiting_payment so user can retry
    await ctx.db.patch(args.bookingId, {
        status: "awaiting_payment",
    });

    // Add payment failed event
    await _addBookingEvent(ctx, args.bookingId, args.userId, "payment_failed", {
        reason: args.reason,
    });

    return booking;
}
