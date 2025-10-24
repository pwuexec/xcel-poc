import { defineTable } from "convex/server";
import { query, mutation } from "../_generated/server";
import { getCurrentUser, getCurrentUserOrThrow, isRole } from "../model/users";
import { Infer, v } from "convex/values";

export const role = v.union(v.literal("user"), v.literal("tutor"), v.literal("admin"));
export type Role = Infer<typeof role>;

export const users = defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(role),
})
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("role", ["role"]);

export const getAllUsers = query({
    handler: async (ctx) => {
        const currentUser = await getCurrentUser(ctx);
        const isTutor = isRole(currentUser, "tutor");

        return await ctx.db.query("users")
            .withIndex("role", isTutor
                ? (q) => q.eq("role", "user")
                : (q) => q.eq("role", "tutor"))
            .collect();
    }
})

export const getMe = query({
    handler: async (ctx) => {
        return await getCurrentUser(ctx);
    }
})

