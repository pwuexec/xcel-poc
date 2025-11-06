import { Infer, v } from "convex/values";

export type PaymentStatus = Infer<typeof paymentStatus>;
export const paymentStatus = v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("succeeded"),
    v.literal("failed"),
    v.literal("canceled"),
    v.literal("refunded"),
);
