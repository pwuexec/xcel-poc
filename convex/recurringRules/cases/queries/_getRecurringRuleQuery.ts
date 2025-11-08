import { QueryCtx, MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";

/**
 * Internal query to get a recurring rule or throw if not found
 */
export async function _getRecurringRuleOrThrow(
    ctx: QueryCtx | MutationCtx,
    ruleId: Id<"recurringRules">
) {
    const rule = await ctx.db.get(ruleId);
    
    if (!rule) {
        throw new Error("Recurring rule not found");
    }

    return rule;
}
