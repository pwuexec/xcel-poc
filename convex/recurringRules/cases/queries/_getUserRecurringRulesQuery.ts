import { QueryCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { getUserByIdOrThrow } from "../../../users/cases/queries/_getCurrentUserQuery";
import { _isRole } from "../../../users/cases/_isRole";

/**
 * Internal query to get recurring rules for a user
 * Used by integrations/reads.ts
 */
export async function _getUserRecurringRulesQuery(
    ctx: QueryCtx,
    args: {
        userId: Id<"users">;
    }
) {
    const currentUser = await getUserByIdOrThrow(ctx, args.userId);
    const isTutor = _isRole(currentUser, "tutor");

    // Use appropriate index based on user role
    const indexName = isTutor ? "by_toUserId" : "by_fromUserId";
    const fieldName = isTutor ? "toUserId" : "fromUserId";

    const rules = await ctx.db
        .query("recurringRules")
        .withIndex(indexName, (q) => q.eq(fieldName, args.userId))
        .collect();

    // Enrich with user info
    const rulesWithUsers = await Promise.all(
        rules.map(async (rule) => {
            const toUser = await getUserByIdOrThrow(ctx, rule.toUserId);
            const fromUser = await getUserByIdOrThrow(ctx, rule.fromUserId);

            return {
                rule,
                toUser,
                fromUser,
                currentUser,
            };
        })
    );

    return rulesWithUsers;
}
