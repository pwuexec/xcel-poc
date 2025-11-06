import { Id } from "../../../_generated/dataModel";
import { MutationCtx } from "../../../_generated/server";

export async function _createPaymentMutation(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
        stripeSessionId: string;
        amount: number;
        currency: string;
        metadata?: {
            description?: string;
            receipt_email?: string;
        };
    }
) {
    const now = Date.now();

    const paymentId = await ctx.db.insert("payments", {
        bookingId: args.bookingId,
        userId: args.userId,
        stripeSessionId: args.stripeSessionId,
        amount: args.amount,
        currency: args.currency,
        status: "pending",
        createdAt: now,
        updatedAt: now,
        metadata: args.metadata,
    });

    return paymentId;
}
