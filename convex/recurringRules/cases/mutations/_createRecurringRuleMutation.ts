import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { DayOfWeek } from "../../types/recurringRule";
import { _validateTutorStudentRelationship } from "../../../bookings/cases/_validateTutorStudentRelationship";

/**
 * Internal mutation to create a recurring rule
 * Used by integrations/writes.ts
 */
export async function _createRecurringRuleMutation(
    ctx: MutationCtx,
    args: {
        fromUserId: Id<"users">;
        toUserId: Id<"users">;
        dayOfWeek: DayOfWeek;
        hourUTC: number;
        minuteUTC: number;
    }
): Promise<Id<"recurringRules">> {
    // Validate tutor-student relationship
    await _validateTutorStudentRelationship(ctx, args.fromUserId, args.toUserId);

    // Validate time values
    if (args.hourUTC < 0 || args.hourUTC > 23) {
        throw new Error("Hour must be between 0 and 23");
    }
    if (args.minuteUTC < 0 || args.minuteUTC > 59) {
        throw new Error("Minute must be between 0 and 59");
    }

    // Check if a similar rule already exists (same users, same day, same time)
    const existingRules = await ctx.db
        .query("recurringRules")
        .withIndex("by_fromUserId_toUserId", (q) =>
            q.eq("fromUserId", args.fromUserId).eq("toUserId", args.toUserId)
        )
        .collect();

    const duplicateRule = existingRules.find(
        (rule) =>
            rule.dayOfWeek === args.dayOfWeek &&
            rule.hourUTC === args.hourUTC &&
            rule.minuteUTC === args.minuteUTC &&
            rule.status === "active"
    );

    if (duplicateRule) {
        throw new Error("A recurring rule with the same schedule already exists");
    }

    const ruleId = await ctx.db.insert("recurringRules", {
        fromUserId: args.fromUserId,
        toUserId: args.toUserId,
        dayOfWeek: args.dayOfWeek,
        hourUTC: args.hourUTC,
        minuteUTC: args.minuteUTC,
        status: "active",
        lastBookingCreatedAt: undefined,
        createdAt: Date.now(),
    });

    return ruleId;
}
