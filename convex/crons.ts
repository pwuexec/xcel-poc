import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Weekly cron job to process recurring booking rules
 * Runs every Monday at 00:00 UTC to create bookings for the upcoming week
 */
crons.weekly(
    "process recurring booking rules",
    {
        dayOfWeek: "monday",
        hourUTC: 0,
        minuteUTC: 0,
    },
    internal.recurringRules.integrations.crons.processRecurringRules
);

/**
 * Auto-complete bookings that have finished
 * Runs every 5 minutes to mark confirmed bookings as completed
 * after their scheduled time + session duration has passed
 */
crons.interval(
    "auto complete finished bookings",
    { minutes: 5 },
    internal.bookings.integrations.crons.autoCompleteBookings
);

export default crons;
