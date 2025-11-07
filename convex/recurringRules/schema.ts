import { defineTable } from "convex/server";
import { v } from "convex/values";
import { dayOfWeek, recurringRuleStatus } from "./types/recurringRule";

export const recurringRules = defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    dayOfWeek: dayOfWeek,
    hourUTC: v.number(),
    minuteUTC: v.number(),
    status: recurringRuleStatus,
    lastBookingCreatedAt: v.optional(v.number()),
    createdAt: v.number(),
})
    .index("by_fromUserId", ["fromUserId"])
    .index("by_toUserId", ["toUserId"])
    .index("by_fromUserId_toUserId", ["fromUserId", "toUserId"])
    .index("by_status", ["status"]);
