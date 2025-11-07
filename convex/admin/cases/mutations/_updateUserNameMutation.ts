import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { getCurrentUserOrThrow } from "../../../users/cases/queries/_getCurrentUserQuery";
import { _isRole } from "../../../users/cases/_isRole";

/**
 * Internal mutation to update user name
 * Used by integrations/writes.ts
 * Requires admin role
 */
export async function _updateUserNameMutation(
    ctx: MutationCtx,
    args: {
        userId: Id<"users">;
        name: string;
    }
) {
    const currentUser = await getCurrentUserOrThrow(ctx);

    // Only admins can update user names
    if (!_isRole(currentUser, "admin")) {
        throw new Error("Unauthorized: Admin access required");
    }

    await ctx.db.patch(args.userId, {
        name: args.name,
    });
}
