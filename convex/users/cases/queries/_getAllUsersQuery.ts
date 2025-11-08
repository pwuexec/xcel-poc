import { QueryCtx } from "../../../_generated/server";
import { getCurrentUser } from "./_getCurrentUserQuery";
import { _isRole } from "../_isRole";
import { formatUserNameGDPR } from "../_formatUserNameGDPR";

/**
 * Internal query to get all users (filtered by role)
 * Used by integrations/reads.ts
 */
export async function _getAllUsersQuery(ctx: QueryCtx) {
    const currentUser = await getCurrentUser(ctx);
    const isTutor = _isRole(currentUser, "tutor");

    const users = await ctx.db.query("users")
        .withIndex("role", isTutor
            ? (q) => q.eq("role", "user")
            : (q) => q.eq("role", "tutor"))
        .collect();

    // Format names with GDPR compliance
    return users.map(user => ({
        ...user,
        name: formatUserNameGDPR(user.name),
    }));
}
