import { internalMutation } from "../../_generated/server";
import { _processRecurringRulesMutation } from "../cases/mutations/_processRecurringRulesMutation";

/**
 * Internal cron job handler to create bookings from active recurring rules
 * This runs weekly and creates bookings for the upcoming week
 */
export const processRecurringRules = internalMutation({
    args: {},
    handler: async (ctx) => {
        return await _processRecurringRulesMutation(ctx);
    },
});
