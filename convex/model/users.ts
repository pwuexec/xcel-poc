import { getAuthUserId } from "@convex-dev/auth/server";
import { MutationCtx, QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { Role } from "../schemas/users";
import { ConvexError } from "convex/values";

const errors = {
    notAuthenticated: new ConvexError("AUTH1:Not authenticated"),
    userNotFound: new ConvexError("AUTH2:User not found"),
}
export async function getCurrentUserId(ctx: QueryCtx | MutationCtx) {
    const userId = await getAuthUserId(ctx);
    console.log("Current user ID:", userId);
    return userId;
}

export async function getCurrentUserIdOrThrow(ctx: QueryCtx | MutationCtx) {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
        throw errors.notAuthenticated;
    }
    return userId;
}

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
        return null;
    }

    return await getUserById(ctx, userId);
}

export async function getCurrentUserOrThrow(ctx: QueryCtx | MutationCtx) {
    const user = await getCurrentUser(ctx);
    if (!user) {
        throw errors.notAuthenticated;
    }
    return user;
}


export async function getUserById(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
    const user = await ctx.db.get(userId);

    return user;
}

export async function getUserByIdOrThrow(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
    const user = await getUserById(ctx, userId);
    if (!user) {
        throw errors.userNotFound;
    }
    return user;
}


export function isRole(
    user: Awaited<ReturnType<typeof getUserById>>,
    role: Role) {
    if (!user?.role) {
        return false;
    }

    return role === user.role
}