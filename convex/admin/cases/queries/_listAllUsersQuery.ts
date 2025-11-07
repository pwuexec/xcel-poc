import { QueryCtx } from "../../../_generated/server";
import { getCurrentUserOrThrow } from "../../../users/cases/queries/_getCurrentUserQuery";
import { _isRole } from "../../../users/cases/_isRole";

/**
 * Internal query to list all users
 * Used by integrations/reads.ts
 * Requires admin role
 */
export async function _listAllUsersQuery(ctx: QueryCtx) {
    const currentUser = await getCurrentUserOrThrow(ctx);

    // Only admins can list all users
    if (!_isRole(currentUser, "admin")) {
        throw new Error("Unauthorized: Admin access required");
    }

    return await ctx.db.query("users").collect();
}
