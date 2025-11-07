import { query } from "../../_generated/server";
import { getCurrentUserOrThrow } from "../../users/cases/queries/_getCurrentUserQuery";
import { _getUserRecurringRulesQuery } from "../cases/queries/_getUserRecurringRulesQuery";

/**
 * Public query to get all recurring rules for the current user
 */
export const getMyRecurringRules = query({
    args: {},
    handler: async (ctx) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        return await _getUserRecurringRulesQuery(ctx, { userId: currentUser._id });
    },
});
