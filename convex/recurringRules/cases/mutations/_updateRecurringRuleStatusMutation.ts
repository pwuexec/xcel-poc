import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { RecurringRuleStatus } from "../../types/recurringRule";
import { _ensureRecurringRuleAccess } from "../_ensureRecurringRuleAccess";

/**
 * Internal mutation to update recurring rule status
 * Used by integrations/writes.ts
 */
export async function _updateRecurringRuleStatusMutation(
    ctx: MutationCtx,
    args: {
        ruleId: Id<"recurringRules">;
        userId: Id<"users">;
        status: RecurringRuleStatus;
    }
) {
    await _ensureRecurringRuleAccess(ctx, args.ruleId, args.userId);

    await ctx.db.patch(args.ruleId, {
        status: args.status,
    });
}
