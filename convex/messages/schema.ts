import { defineTable } from "convex/server";
import { v } from "convex/values";

export const messages = defineTable({
    bookingId: v.id("bookings"),
    userId: v.id("users"),
    message: v.string(),
    timestamp: v.number(),
    readBy: v.array(v.id("users")),
})
    .index("bookingId", ["bookingId"])
    .index("timestamp", ["timestamp"]);
