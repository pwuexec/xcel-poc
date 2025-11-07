import { Id } from "../../_generated/dataModel";
import { QueryCtx, MutationCtx } from "../../_generated/server";

/**
 * Internal helper to get a single recurring rule
 * Used by other internal helpers
 */
export async function getRecurringRuleOrThrow(
    ctx: QueryCtx | MutationCtx,
    ruleId: Id<"recurringRules">
) {
    const rule = await ctx.db.get(ruleId);
    if (!rule) {
        throw new Error("Recurring rule not found");
    }
    return rule;
}

/**
 * Internal helper to ensure user has access to a recurring rule
 * Used by mutations
 */
export async function _ensureRecurringRuleAccess(
    ctx: QueryCtx | MutationCtx,
    ruleId: Id<"recurringRules">,
    userId: Id<"users">
) {
    const rule = await getRecurringRuleOrThrow(ctx, ruleId);

    if (rule.fromUserId !== userId && rule.toUserId !== userId) {
        throw new Error("Not authorized to access this recurring rule");
    }

    return rule;
}
