import { v, Infer } from "convex/values";

// Status validator and type
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

export type BookingStatus = Infer<typeof bookingStatus>;

// Status filter groups
export const activeStatusFilter = v.union(
    v.literal("pending"),
    v.literal("awaiting_reschedule"),
    v.literal("awaiting_payment"),
    v.literal("processing_payment"),
    v.literal("confirmed"),
);

export const pastStatusFilter = v.union(
    v.literal("completed"),
    v.literal("canceled"),
    v.literal("rejected"),
);

export type ActiveStatusFilter = Infer<typeof activeStatusFilter>;
export type PastStatusFilter = Infer<typeof pastStatusFilter>;

// Arrays of status values for filtering (can be safely imported in browser)
export const ACTIVE_STATUSES: ActiveStatusFilter[] = [
    "pending",
    "awaiting_reschedule",
    "awaiting_payment",
    "processing_payment",
    "confirmed"
];

export const PAST_STATUSES: PastStatusFilter[] = [
    "completed",
    "canceled",
    "rejected"
];
