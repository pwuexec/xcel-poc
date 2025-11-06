import { Id } from "../../../_generated/dataModel";
import { QueryCtx } from "../../../_generated/server";

/**
 * Helper to get all payments for a user
 */
export async function _getUserPaymentsQuery(
    ctx: QueryCtx,
    userId: Id<"users">
) {
    const payments = await ctx.db
        .query("payments")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();

    return payments;
}
