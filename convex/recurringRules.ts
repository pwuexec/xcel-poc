import { internalMutation } from "./_generated/server";
import { _createBookingMutation } from "./bookings/cases/mutations/_createBookingMutation";
import {
    getNextBookingTimestamp,
    shouldCreateBookingThisWeek,
} from "./model/recurringRules";

/**
 * Cron job handler to create bookings from active recurring rules
 * This runs weekly and creates bookings for the upcoming week
 */
export const processRecurringRules = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = new Date();
        
        // Get all active recurring rules
        const activeRules = await ctx.db
            .query("recurringRules")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();

        let processedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        console.log(`Processing ${activeRules.length} active recurring rules`);

        for (const rule of activeRules) {
            try {
                // Check if we should create a booking this week
                if (!shouldCreateBookingThisWeek(rule.lastBookingCreatedAt, now)) {
                    console.log(
                        `Skipping rule ${rule._id}: already created booking this week`
                    );
                    skippedCount++;
                    continue;
                }

                // Calculate the next booking timestamp
                const nextTimestamp = getNextBookingTimestamp(
                    rule.dayOfWeek,
                    rule.hourUTC,
                    rule.minuteUTC,
                    now
                );

                // Create the booking
                const bookingId = await _createBookingMutation(ctx, {
                    fromUserId: rule.fromUserId,
                    toUserId: rule.toUserId,
                    timestamp: nextTimestamp,
                });

                // Update the rule's lastBookingCreatedAt
                await ctx.db.patch(rule._id, {
                    lastBookingCreatedAt: Date.now(),
                });

                console.log(
                    `Created booking ${bookingId} from recurring rule ${rule._id} for ${new Date(nextTimestamp).toISOString()}`
                );

                processedCount++;
            } catch (error) {
                console.error(
                    `Error processing recurring rule ${rule._id}:`,
                    error
                );
                errorCount++;
            }
        }

        console.log(
            `Recurring rules processing complete: ${processedCount} created, ${skippedCount} skipped, ${errorCount} errors`
        );

        return {
            processedCount,
            skippedCount,
            errorCount,
            totalRules: activeRules.length,
        };
    },
});
