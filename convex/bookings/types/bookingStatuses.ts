import { v, Infer } from "convex/values";

export type BookingStatus = Infer<typeof bookingStatus>;
export const bookingStatus = v.union(
    v.literal("pending"),
    v.literal("awaiting_payment"),
    v.literal("processing_payment"),
    v.literal("confirmed"),
    v.literal("canceled"),
    v.literal("completed"),
    v.literal("rejected"),
    v.literal("awaiting_reschedule"),
);

export type ActiveStatusFilter = Infer<typeof activeStatusFilter>;
export const activeStatusFilter = v.union(
    v.literal("pending"),
    v.literal("awaiting_reschedule"),
    v.literal("awaiting_payment"),
    v.literal("processing_payment"),
    v.literal("confirmed"),
);

export type PastStatusFilter = Infer<typeof pastStatusFilter>;
export const pastStatusFilter = v.union(
    v.literal("completed"),
    v.literal("canceled"),
    v.literal("rejected"),
);

export const ACTIVE_STATUSES: ActiveStatusFilter[] = [
    "pending",
    "awaiting_reschedule",
    "awaiting_payment",
    "processing_payment",
    "confirmed",
] as const;

export const PAST_STATUSES: PastStatusFilter[] = [
    "completed",
    "canceled",
    "rejected",
] as const;
