import { defineTable } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUserOrThrow } from "../users/cases/queries/_getCurrentUserQuery";
import * as RecurringRules from "../model/recurringRules";

// Re-export validators and types from model
export { dayOfWeek, recurringRuleStatus } from "../model/recurringRules";
export type { DayOfWeek, RecurringRuleStatus } from "../model/recurringRules";

export const recurringRules = defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    dayOfWeek: RecurringRules.dayOfWeek,
    hourUTC: v.number(),
    minuteUTC: v.number(),
    status: RecurringRules.recurringRuleStatus,
    lastBookingCreatedAt: v.optional(v.number()),
    createdAt: v.number(),
})
    .index("by_fromUserId", ["fromUserId"])
    .index("by_toUserId", ["toUserId"])
    .index("by_fromUserId_toUserId", ["fromUserId", "toUserId"])
    .index("by_status", ["status"]);

// Create a new recurring rule
export const createRecurringRule = mutation({
    args: {
        toUserId: v.id("users"),
        dayOfWeek: RecurringRules.dayOfWeek,
        hourUTC: v.number(),
        minuteUTC: v.number(),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        
        const ruleId = await RecurringRules.createRecurringRuleHelper(ctx, {
            fromUserId: currentUser._id,
            toUserId: args.toUserId,
            dayOfWeek: args.dayOfWeek,
            hourUTC: args.hourUTC,
            minuteUTC: args.minuteUTC,
        });

        return ruleId;
    },
});

// Get all recurring rules for the current user
export const getMyRecurringRules = query({
    args: {},
    handler: async (ctx) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        return await RecurringRules.getUserRecurringRules(ctx, currentUser._id);
    },
});

// Pause a recurring rule
export const pauseRecurringRule = mutation({
    args: {
        ruleId: v.id("recurringRules"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        
        await RecurringRules.updateRecurringRuleStatusHelper(ctx, {
            ruleId: args.ruleId,
            userId: currentUser._id,
            status: "paused",
        });
    },
});

// Resume a recurring rule
export const resumeRecurringRule = mutation({
    args: {
        ruleId: v.id("recurringRules"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        
        await RecurringRules.updateRecurringRuleStatusHelper(ctx, {
            ruleId: args.ruleId,
            userId: currentUser._id,
            status: "active",
        });
    },
});

// Cancel a recurring rule (soft delete)
export const cancelRecurringRule = mutation({
    args: {
        ruleId: v.id("recurringRules"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        
        await RecurringRules.updateRecurringRuleStatusHelper(ctx, {
            ruleId: args.ruleId,
            userId: currentUser._id,
            status: "canceled",
        });
    },
});

// Delete a recurring rule (hard delete)
export const deleteRecurringRule = mutation({
    args: {
        ruleId: v.id("recurringRules"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        
        await RecurringRules.deleteRecurringRuleHelper(ctx, {
            ruleId: args.ruleId,
            userId: currentUser._id,
        });
    },
});
