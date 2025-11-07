import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { role } from "../../users/types/role";
import { _updateUserRoleMutation } from "../cases/mutations/_updateUserRoleMutation";
import { _updateUserNameMutation } from "../cases/mutations/_updateUserNameMutation";
import { _createUserMutation } from "../cases/mutations/_createUserMutation";

/**
 * Public mutation to update user role
 * Requires admin role
 */
export const updateUserRole = mutation({
    args: {
        userId: v.id("users"),
        role: role,
    },
    handler: async (ctx, args) => {
        await _updateUserRoleMutation(ctx, args);
    }
});

/**
 * Public mutation to update user name
 * Requires admin role
 */
export const updateUserName = mutation({
    args: {
        userId: v.id("users"),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        await _updateUserNameMutation(ctx, args);
    }
});

/**
 * Public mutation to create a new user
 * Requires admin role
 */
export const createUser = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        role: role,
        password: v.string(),
    },
    handler: async (ctx, args) => {
        return await _createUserMutation(ctx, args);
    }
});
