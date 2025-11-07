import { internalMutation } from "../../_generated/server";
import { _autoCompleteBookingsMutation } from "../cases/mutations/_autoCompleteBookingsMutation";

/**
 * Auto-complete bookings cron job handler
 * Runs every 5 minutes to check for confirmed bookings that have passed their scheduled time
 */
export const autoCompleteBookings = internalMutation({
    args: {},
    handler: async (ctx) => {
        return await _autoCompleteBookingsMutation(ctx);
    },
});
