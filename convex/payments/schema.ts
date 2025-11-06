import { defineTable } from "convex/server";
import { v } from "convex/values";
import { paymentStatus } from "./types/paymentStatus";

export const payments = defineTable({
    bookingId: v.id("bookings"),
    userId: v.id("users"),
    stripeSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: paymentStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
    metadata: v.optional(v.object({
        description: v.optional(v.string()),
        receipt_email: v.optional(v.string()),
    })),
})
    .index("bookingId", ["bookingId"])
    .index("userId", ["userId"])
    .index("stripeSessionId", ["stripeSessionId"])
    .index("stripePaymentIntentId", ["stripePaymentIntentId"]);
