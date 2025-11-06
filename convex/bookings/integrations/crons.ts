import { internalMutation } from "../../_generated/server";
import { autoCompleteBookingsCase } from "../cases/autoCompleteBookingsCase";

/**
 * Auto-complete bookings cron job handler
 * Runs every 5 minutes to check for confirmed bookings that have passed their scheduled time
 */
export const autoCompleteBookings = internalMutation({
    args: {},
    handler: async (ctx) => {
        return await autoCompleteBookingsCase(ctx);
    },
});
