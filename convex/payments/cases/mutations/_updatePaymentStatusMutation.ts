import { MutationCtx } from "../../../_generated/server";
import { _addBookingEvent } from "../../../bookings/cases/_addBookingEvent";
import { PaymentStatus } from "../../types/paymentStatus";

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

    // Update booking status and add event based on payment status
    if (args.status === "succeeded") {
        await ctx.db.patch(payment.bookingId, {
            status: "confirmed",
        });

        await _addBookingEvent(
            ctx,
            payment.bookingId,
            payment.userId,
            "payment_succeeded",
            {
                amount: payment.amount,
                currency: payment.currency,
                stripePaymentIntentId: args.stripePaymentIntentId!,
            }
        );
    } else if (args.status === "failed") {
        await ctx.db.patch(payment.bookingId, {
            status: "awaiting_payment",
        });

        await _addBookingEvent(
            ctx,
            payment.bookingId,
            payment.userId,
            "payment_failed",
            {
                reason: "Payment processing failed",
            }
        );
    } else if (args.status === "canceled") {
        await ctx.db.patch(payment.bookingId, {
            status: "awaiting_payment",
        });
    }

    return payment;
}
