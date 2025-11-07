import { defineTable } from "convex/server";
import { v } from "convex/values";
import { bookingStatus } from "./types/bookingStatuses";
import { bookingEvent } from "./types/bookingEvents";

export const bookings = defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    timestamp: v.number(),
    status: bookingStatus,
    bookingType: v.union(v.literal("paid"), v.literal("free")),
    events: v.array(bookingEvent),
    lastActionByUserId: v.optional(v.id("users")),
})
    // Indexes for pagination with descending timestamp order
    .index("by_fromUserId_timestamp", ["fromUserId", "timestamp"])
    .index("by_toUserId_timestamp", ["toUserId", "timestamp"])
    .index("by_fromUserId_status_timestamp", ["fromUserId", "status", "timestamp"])
    .index("by_toUserId_status_timestamp", ["toUserId", "status", "timestamp"])
    // Indexes for querying bookings between two users with status and type
    .index("by_fromUserId_toUserId_bookingType_status", ["fromUserId", "toUserId", "bookingType", "status"])
    .index("by_toUserId_fromUserId_bookingType_status", ["toUserId", "fromUserId", "bookingType", "status"])
    // Index for status-based queries
    .index("by_status_timestamp", ["status", "timestamp"]);
