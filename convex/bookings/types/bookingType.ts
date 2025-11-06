import { Infer, v } from "convex/values";

export type BookingType = Infer<typeof bookingType>;
export const bookingType = v.union(v.literal("paid"), v.literal("free"));
