import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { _addBookingEventMutation } from "../../../bookings/cases/mutations/_addBookingEventMutation";
import { _ensureBookingAccess } from "../../../bookings/cases/_ensureBookingAccess";

/**
 * Helper mutation to initiate payment for a booking
 * Updates booking status to processing_payment and records the payment initiation event
 */
export async function _initiatePaymentMutation(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
        amount: number;
        currency: string;
        stripeSessionId: string;
    }
) {
    const booking = await _ensureBookingAccess(ctx, args.bookingId, args.userId);

    // Can only initiate payment for bookings awaiting payment
    if (booking.status !== "awaiting_payment") {
        throw new Error("Can only initiate payment for bookings awaiting payment");
    }

    // Update booking status to processing_payment
    await ctx.db.patch(args.bookingId, {
        status: "processing_payment",
    });

    // Add payment initiated event
    await _addBookingEventMutation(ctx, args.bookingId, args.userId, "payment_initiated", {
        amount: args.amount,
        currency: args.currency,
        stripeSessionId: args.stripeSessionId,
    });

    return booking;
}
