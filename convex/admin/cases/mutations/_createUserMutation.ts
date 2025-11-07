import { MutationCtx } from "../../../_generated/server";
import { getCurrentUserOrThrow } from "../../../users/cases/queries/_getCurrentUserQuery";
import { _isRole } from "../../../users/cases/_isRole";
import { Role } from "../../../users/types/role";
import { createAccount } from "@convex-dev/auth/server";
import { Id } from "../../../_generated/dataModel";

/**
 * Internal mutation to create a new user
 * Used by integrations/writes.ts
 * Requires admin role
 */
export async function _createUserMutation(
    ctx: MutationCtx,
    args: {
        name: string;
        email: string;
        role: Role;
        password: string;
    }
): Promise<Id<"users">> {
    const currentUser = await getCurrentUserOrThrow(ctx);

    // Only admins can create users
    if (!_isRole(currentUser, "admin")) {
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
