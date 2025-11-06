import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";

/**
 * Internal mutation to add a LessonSpace URL to a booking
 * Called by cron jobs that pre-generate URLs before lessons start
 */
export async function _addLessonSpaceUrlMutation(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        lessonSpaceUrl: string;
    }
) {
    const booking = await ctx.db.get(args.bookingId);

    if (!booking) {
        throw new Error("Booking not found");
    }

    await ctx.db.patch(args.bookingId, {
        lessonSpaceUrl: args.lessonSpaceUrl,
    });

    console.log(
        `[_addLessonSpaceUrlMutation] Added LessonSpace URL to booking ${args.bookingId}`
    );
}
