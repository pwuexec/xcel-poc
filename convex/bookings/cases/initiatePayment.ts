import { MutationCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { _addBookingEvent } from "./_addBookingEvent";
import { _ensureBookingAccess } from "./_ensureBookingAccess";

export async function initiatePayment(
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
    await _addBookingEvent(ctx, args.bookingId, args.userId, "payment_initiated", {
        amount: args.amount,
        currency: args.currency,
        stripeSessionId: args.stripeSessionId,
    });

    return booking;
}
