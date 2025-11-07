import { Infer, v } from "convex/values";

export const role = v.union(v.literal("user"), v.literal("tutor"), v.literal("admin"));
export type Role = Infer<typeof role>;
