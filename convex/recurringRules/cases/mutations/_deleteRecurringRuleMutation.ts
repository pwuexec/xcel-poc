import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { _ensureRecurringRuleAccess } from "../_ensureRecurringRuleAccess";

/**
 * Internal mutation to delete recurring rule
 * Used by integrations/writes.ts
 */
export async function _deleteRecurringRuleMutation(
    ctx: MutationCtx,
    args: {
        ruleId: Id<"recurringRules">;
        userId: Id<"users">;
    }
) {
    await _ensureRecurringRuleAccess(ctx, args.ruleId, args.userId);

    await ctx.db.delete(args.ruleId);
}
