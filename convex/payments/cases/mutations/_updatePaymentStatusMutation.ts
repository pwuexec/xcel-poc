import { MutationCtx } from "../../../_generated/server";
import { PaymentStatus } from "../../types/paymentStatus";
import { _markPaymentSucceededMutation } from "./_markPaymentSucceededMutation";
import { _markPaymentFailedMutation } from "./_markPaymentFailedMutation";

export async function _updatePaymentStatusMutation(
    ctx: MutationCtx,
    args: {
        stripeSessionId: string;
        stripePaymentIntentId?: string;
        status: PaymentStatus;
    }
) {
    const payment = await ctx.db
        .query("payments")
        .withIndex("stripeSessionId", (q) => q.eq("stripeSessionId", args.stripeSessionId))
        .first();

    if (!payment) {
        throw new Error("Payment not found");
    }

    await ctx.db.patch(payment._id, {
        status: args.status,
        stripePaymentIntentId: args.stripePaymentIntentId,
        updatedAt: Date.now(),
    });

    // Update booking status and add event based on payment status using helper mutations
    if (args.status === "succeeded") {
        await _markPaymentSucceededMutation(ctx, {
            bookingId: payment.bookingId,
            userId: payment.userId,
            amount: payment.amount,
            currency: payment.currency,
            stripePaymentIntentId: args.stripePaymentIntentId!,
        });
    } else if (args.status === "failed") {
        await _markPaymentFailedMutation(ctx, {
            bookingId: payment.bookingId,
            userId: payment.userId,
            reason: "Payment processing failed",
        });
    } else if (args.status === "canceled") {
        await ctx.db.patch(payment.bookingId, {
            status: "awaiting_payment",
        });
    }

    return payment;
}
