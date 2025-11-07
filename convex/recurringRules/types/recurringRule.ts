import { Infer, v } from "convex/values";

// Days of the week validator
export const dayOfWeek = v.union(
    v.literal("monday"),
    v.literal("tuesday"),
    v.literal("wednesday"),
    v.literal("thursday"),
    v.literal("friday"),
    v.literal("saturday"),
    v.literal("sunday")
);

export type DayOfWeek = Infer<typeof dayOfWeek>;

// Recurring rule status validator
export const recurringRuleStatus = v.union(
    v.literal("active"),
    v.literal("paused"),
    v.literal("canceled")
);

export type RecurringRuleStatus = Infer<typeof recurringRuleStatus>;
