import { MutationCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { _addBookingEvent } from "./_addBookingEvent";
import { _getBookingOrThrow } from "./_getBookingOrThrow";

export async function markPaymentSucceeded(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
        amount: number;
        currency: string;
        stripePaymentIntentId: string;
    }
) {
    const booking = await _getBookingOrThrow(ctx, args.bookingId);

    // Update booking status to confirmed
    await ctx.db.patch(args.bookingId, {
        status: "confirmed",
    });

    // Add payment succeeded event
    await _addBookingEvent(ctx, args.bookingId, args.userId, "payment_succeeded", {
        amount: args.amount,
        currency: args.currency,
        stripePaymentIntentId: args.stripePaymentIntentId,
    });

    return booking;
}
