import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { _addBookingEvent } from "../../../bookings/cases/_addBookingEvent";
import { _ensureBookingAccess } from "../../../bookings/cases/_ensureBookingAccess";

/**
 * Helper mutation to refund a payment
 * Records the refund event and cancels the booking if it was confirmed
 */
export async function _refundPaymentMutation(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
        amount: number;
        currency: string;
        stripePaymentIntentId: string;
    }
) {
    const booking = await _ensureBookingAccess(ctx, args.bookingId, args.userId);

    // Can only refund confirmed or completed bookings that had payment
    if (booking.status !== "confirmed" && booking.status !== "completed" && booking.status !== "canceled") {
        throw new Error("Can only refund confirmed, completed, or canceled bookings");
    }

    if (booking.bookingType !== "paid") {
        throw new Error("Cannot refund a free booking");
    }

    // Add payment refunded event
    await _addBookingEvent(ctx, args.bookingId, args.userId, "payment_refunded", {
        amount: args.amount,
        currency: args.currency,
        stripePaymentIntentId: args.stripePaymentIntentId,
    });

    // If booking is confirmed, mark it as canceled after refund
    if (booking.status === "confirmed") {
        await ctx.db.patch(args.bookingId, {
            status: "canceled",
        });
    }

    return booking;
}
