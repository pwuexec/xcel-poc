import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { getCurrentUserOrThrow, isRole } from "../model/users";
import { role } from "./users";
import { createAccount, getAuthUserId } from "@convex-dev/auth/server";

export const listAllUsers = query({
    handler: async (ctx) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        // Only admins can list all users
        if (!isRole(currentUser, "admin")) {
            throw new Error("Unauthorized: Admin access required");
        }

        return await ctx.db.query("users").collect();
    }
})

export const updateUserRole = mutation({
    args: {
        userId: v.id("users"),
        role: role,
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        // Only admins can update roles
        if (!isRole(currentUser, "admin")) {
            throw new Error("Unauthorized: Admin access required");
        }

        // Prevent admins from changing their own role
        if (currentUser._id === args.userId) {
            throw new Error("You cannot change your own role");
        }

        await ctx.db.patch(args.userId, {
            role: args.role,
        });
    }
})

export const updateUserName = mutation({
    args: {
        userId: v.id("users"),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        // Only admins can update user names
        if (!isRole(currentUser, "admin")) {
            throw new Error("Unauthorized: Admin access required");
        }

        await ctx.db.patch(args.userId, {
            name: args.name,
        });
    }
})

export const createUser = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        role: role,
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        // Only admins can create users
        if (!isRole(currentUser, "admin")) {
            throw new Error("Unauthorized: Admin access required");
        }

        // Check if email already exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", args.email))
            .first();

        if (existingUser) {
            throw new Error("A user with this email already exists");
        }

        const newUser = await createAccount(ctx as any, {
            provider: "password",
            account: {
                id: args.email,
                secret: args.password,
            },
            profile: {
                name: args.name,
                email: args.email,
                role: args.role
            },
            shouldLinkViaEmail: false,
            shouldLinkViaPhone: false,
        });

        return newUser.user._id;
    }
})
