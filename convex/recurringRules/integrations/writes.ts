import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { getCurrentUserOrThrow } from "../../users/cases/queries/_getCurrentUserQuery";
import { dayOfWeek } from "../types/recurringRule";
import { _createRecurringRuleMutation } from "../cases/mutations/_createRecurringRuleMutation";
import { _updateRecurringRuleStatusMutation } from "../cases/mutations/_updateRecurringRuleStatusMutation";
import { _deleteRecurringRuleMutation } from "../cases/mutations/_deleteRecurringRuleMutation";

/**
 * Public mutation to create a new recurring rule
 */
export const createRecurringRule = mutation({
    args: {
        toUserId: v.id("users"),
        dayOfWeek: dayOfWeek,
        hourUTC: v.number(),
        minuteUTC: v.number(),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        
        const ruleId = await _createRecurringRuleMutation(ctx, {
            fromUserId: currentUser._id,
            toUserId: args.toUserId,
            dayOfWeek: args.dayOfWeek,
            hourUTC: args.hourUTC,
            minuteUTC: args.minuteUTC,
        });

        return ruleId;
    },
});

/**
 * Public mutation to pause a recurring rule
 */
export const pauseRecurringRule = mutation({
    args: {
        ruleId: v.id("recurringRules"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        
        await _updateRecurringRuleStatusMutation(ctx, {
            ruleId: args.ruleId,
            userId: currentUser._id,
            status: "paused",
        });
    },
});

/**
 * Public mutation to resume a recurring rule
 */
export const resumeRecurringRule = mutation({
    args: {
        ruleId: v.id("recurringRules"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        
        await _updateRecurringRuleStatusMutation(ctx, {
            ruleId: args.ruleId,
            userId: currentUser._id,
            status: "active",
        });
    },
});

/**
 * Public mutation to cancel a recurring rule (soft delete)
 */
export const cancelRecurringRule = mutation({
    args: {
        ruleId: v.id("recurringRules"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        
        await _updateRecurringRuleStatusMutation(ctx, {
            ruleId: args.ruleId,
            userId: currentUser._id,
            status: "canceled",
        });
    },
});

/**
 * Public mutation to delete a recurring rule (hard delete)
 */
export const deleteRecurringRule = mutation({
    args: {
        ruleId: v.id("recurringRules"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        
        await _deleteRecurringRuleMutation(ctx, {
            ruleId: args.ruleId,
            userId: currentUser._id,
        });
    },
});
