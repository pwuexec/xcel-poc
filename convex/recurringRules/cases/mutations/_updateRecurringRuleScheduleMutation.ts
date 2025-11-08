import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { DayOfWeek } from "../../types/recurringRule";
import { _getRecurringRuleOrThrow } from "../queries/_getRecurringRuleQuery";

/**
 * Internal mutation to update a recurring rule's schedule
 * Used by integrations/writes.ts
 */
export async function _updateRecurringRuleScheduleMutation(
    ctx: MutationCtx,
    args: {
        ruleId: Id<"recurringRules">;
        userId: Id<"users">;
        dayOfWeek: DayOfWeek;
        hourUTC: number;
        minuteUTC: number;
    }
): Promise<void> {
    const rule = await _getRecurringRuleOrThrow(ctx, args.ruleId);

    // Verify the user is the owner of the rule (fromUserId)
    if (rule.fromUserId !== args.userId) {
        throw new Error("You can only update your own recurring rules");
    }

    // Validate time values
    if (args.hourUTC < 0 || args.hourUTC > 23) {
        throw new Error("Hour must be between 0 and 23");
    }
    if (args.minuteUTC < 0 || args.minuteUTC > 59) {
        throw new Error("Minute must be between 0 and 59");
    }

    // Check if a similar rule already exists (same users, same day, same time) excluding current rule
    const existingRules = await ctx.db
        .query("recurringRules")
        .withIndex("by_fromUserId_toUserId", (q) =>
            q.eq("fromUserId", rule.fromUserId).eq("toUserId", rule.toUserId)
        )
        .collect();

    const duplicateRule = existingRules.find(
        (r) =>
            r._id !== args.ruleId &&
            r.dayOfWeek === args.dayOfWeek &&
            r.hourUTC === args.hourUTC &&
            r.minuteUTC === args.minuteUTC &&
            r.status === "active"
    );

    if (duplicateRule) {
        throw new Error("A recurring rule with the same schedule already exists");
    }

    // Update the rule
    await ctx.db.patch(args.ruleId, {
        dayOfWeek: args.dayOfWeek,
        hourUTC: args.hourUTC,
        minuteUTC: args.minuteUTC,
    });
}
