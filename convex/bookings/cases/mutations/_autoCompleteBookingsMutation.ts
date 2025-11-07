import { Id } from "../../../_generated/dataModel";
import { MutationCtx } from "../../../_generated/server";
import { _addBookingEventMutation } from "./_addBookingEventMutation";

/**
 * Business logic to auto-complete bookings that have finished
 * Checks for confirmed bookings that have passed their scheduled time
 */
export async function _autoCompleteBookingsMutation(ctx: MutationCtx) {
    const now = Date.now();
    
    // Assume a booking session lasts 1 hour (configurable)
    const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour in milliseconds
    
    // Calculate the cutoff time - bookings before this time should be completed
    const cutoffTime = now - SESSION_DURATION_MS;
    
    // Use index to get confirmed bookings that have passed their end time
    // This uses the by_status_timestamp index efficiently
    const confirmedBookings = await ctx.db
        .query("bookings")
        .withIndex("by_status_timestamp", (q) => 
            q.eq("status", "confirmed").lt("timestamp", cutoffTime)
        )
        .collect();

    let completedCount = 0;
    let skippedCount = 0;

    console.log(`Checking ${confirmedBookings.length} confirmed bookings for auto-completion`);

    for (const booking of confirmedBookings) {
        // All bookings returned from the query are past their end time
        // So we can directly mark them as completed
        try {
            const result = await markBookingAsCompleted(ctx, booking._id);
            
            if (result) {
                console.log(
                    `Auto-completed booking ${booking._id} (scheduled for ${new Date(booking.timestamp).toISOString()})`
                );
                completedCount++;
            } else {
                skippedCount++;
            }
        } catch (error) {
            console.error(
                `Error auto-completing booking ${booking._id}:`,
                error
            );
        }
    }

    console.log(
        `Auto-completion complete: ${completedCount} completed, ${skippedCount} skipped/not ready`
    );

    return {
        completedCount,
        skippedCount,
        totalChecked: confirmedBookings.length,
    };
}

async function markBookingAsCompleted(
    ctx: MutationCtx,
    bookingId: Id<"bookings">
) {
    const booking = await ctx.db.get(bookingId);
    if (!booking) {
        return null; // Booking no longer exists
    }

    // Only mark as completed if it's currently confirmed
    if (booking.status !== "confirmed") {
        return null;
    }

    // Update status to completed
    await ctx.db.patch(bookingId, {
        status: "completed",
    });

    // Add completion event - use the tutor's ID as the actor
    await _addBookingEventMutation(ctx, bookingId, booking.toUserId, "completed", {
        completedAt: Date.now(),
    });

    return booking;
}
