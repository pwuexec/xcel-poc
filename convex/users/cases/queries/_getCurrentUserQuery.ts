import { getAuthUserId } from "@convex-dev/auth/server";
import { MutationCtx, QueryCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { ConvexError } from "convex/values";

const errors = {
    notAuthenticated: new ConvexError("AUTH1:Not authenticated"),
    userNotFound: new ConvexError("AUTH2:User not found"),
}

/**
 * Internal query to get current user ID
 * Used by other internal helpers
 */
export async function getCurrentUserId(ctx: QueryCtx | MutationCtx) {
    const userId = await getAuthUserId(ctx);
    console.log("Current user ID:", userId);
    return userId;
}

/**
 * Internal query to get current user ID or throw
 * Used by other internal helpers
 */
export async function getCurrentUserIdOrThrow(ctx: QueryCtx | MutationCtx) {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
        throw errors.notAuthenticated;
    }
    return userId;
}

/**
 * Internal query to get current user
 * Returns null if not authenticated
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
        return null;
    }

    return await getUserById(ctx, userId);
}

/**
 * Internal query to get current user or throw
 * Used by integrations/reads.ts
 */
export async function getCurrentUserOrThrow(ctx: QueryCtx | MutationCtx) {
    const user = await getCurrentUser(ctx);
    if (!user) {
        throw errors.notAuthenticated;
    }
    return user;
}

/**
 * Internal query to get user by ID
 * Used by other internal helpers
 */
export async function getUserById(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
    const user = await ctx.db.get(userId);
    return user;
}

/**
 * Internal query to get user by ID or throw
 * Used by other internal helpers
 */
export async function getUserByIdOrThrow(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
    const user = await getUserById(ctx, userId);
    if (!user) {
        throw errors.userNotFound;
    }
    return user;
}
