import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { getCurrentUserOrThrow } from "../../../users/cases/queries/_getCurrentUserQuery";
import { _isRole } from "../../../users/cases/_isRole";
import { Role } from "../../../users/types/role";

/**
 * Internal mutation to update user role
 * Used by integrations/writes.ts
 * Requires admin role
 */
export async function _updateUserRoleMutation(
    ctx: MutationCtx,
    args: {
        userId: Id<"users">;
        role: Role;
    }
) {
    const currentUser = await getCurrentUserOrThrow(ctx);

    // Only admins can update roles
    if (!_isRole(currentUser, "admin")) {
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
