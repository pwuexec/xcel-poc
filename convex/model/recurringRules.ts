import { MutationCtx, QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { Infer, v } from "convex/values";
import { getUserByIdOrThrow, isRole } from "./users";
import { _validateTutorStudentRelationship } from "../bookings/cases/_validateTutorStudentRelationship";

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

// Helper to get recurring rules for a user
export async function getUserRecurringRules(
    ctx: QueryCtx,
    userId: Id<"users">
) {
    const currentUser = await getUserByIdOrThrow(ctx, userId);
    const isTutor = isRole(currentUser, "tutor");

    // Use appropriate index based on user role
    const indexName = isTutor ? "by_toUserId" : "by_fromUserId";
    const fieldName = isTutor ? "toUserId" : "fromUserId";

    const rules = await ctx.db
        .query("recurringRules")
        .withIndex(indexName, (q) => q.eq(fieldName, userId))
        .collect();

    // Enrich with user info
    const rulesWithUsers = await Promise.all(
        rules.map(async (rule) => {
            const toUser = await getUserByIdOrThrow(ctx, rule.toUserId);
            const fromUser = await getUserByIdOrThrow(ctx, rule.fromUserId);

            return {
                rule,
                toUser,
                fromUser,
                currentUser,
            };
        })
    );

    return rulesWithUsers;
}

// Helper to get a single recurring rule
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

// Helper to ensure user has access to a recurring rule
export async function ensureRecurringRuleAccess(
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

// Helper to create a recurring rule
export async function createRecurringRuleHelper(
    ctx: MutationCtx,
    args: {
        fromUserId: Id<"users">;
        toUserId: Id<"users">;
        dayOfWeek: DayOfWeek;
        hourUTC: number;
        minuteUTC: number;
    }
) {
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

// Helper to update recurring rule status
export async function updateRecurringRuleStatusHelper(
    ctx: MutationCtx,
    args: {
        ruleId: Id<"recurringRules">;
        userId: Id<"users">;
        status: RecurringRuleStatus;
    }
) {
    await ensureRecurringRuleAccess(ctx, args.ruleId, args.userId);

    await ctx.db.patch(args.ruleId, {
        status: args.status,
    });
}

// Helper to delete recurring rule
export async function deleteRecurringRuleHelper(
    ctx: MutationCtx,
    args: {
        ruleId: Id<"recurringRules">;
        userId: Id<"users">;
    }
) {
    await ensureRecurringRuleAccess(ctx, args.ruleId, args.userId);

    await ctx.db.delete(args.ruleId);
}

// Helper function for cron job: calculate next booking timestamp
export function getNextBookingTimestamp(
    dayOfWeek: DayOfWeek,
    hourUTC: number,
    minuteUTC: number,
    fromDate: Date = new Date()
): number {
    const daysMap: Record<DayOfWeek, number> = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
    };

    const targetDay = daysMap[dayOfWeek];
    const now = new Date(fromDate);
    const currentDay = now.getUTCDay();

    // Calculate days until target day
    let daysUntilTarget = targetDay - currentDay;
    
    // If target day is today or in the past this week, schedule for next week
    if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
    }

    // Create the target date
    const targetDate = new Date(now);
    targetDate.setUTCDate(now.getUTCDate() + daysUntilTarget);
    targetDate.setUTCHours(hourUTC, minuteUTC, 0, 0);

    return targetDate.getTime();
}

// Helper to check if a booking should be created this week
export function shouldCreateBookingThisWeek(
    lastBookingCreatedAt: number | undefined,
    now: Date = new Date()
): boolean {
    if (!lastBookingCreatedAt) {
        return true; // First time, create a booking
    }

    const lastCreated = new Date(lastBookingCreatedAt);
    const currentWeekStart = getWeekStart(now);
    const lastCreatedWeekStart = getWeekStart(lastCreated);

    // Create a booking if we haven't created one this week yet
    return currentWeekStart.getTime() > lastCreatedWeekStart.getTime();
}

// Helper to get the start of the current week (Monday 00:00 UTC)
function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday
    d.setUTCDate(d.getUTCDate() + diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}
