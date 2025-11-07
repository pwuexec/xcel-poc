import { DayOfWeek } from "../types/recurringRule";

/**
 * Helper function for cron job: calculate next booking timestamp
 * Used by cron jobs and internal mutations
 */
export function _getNextBookingTimestamp(
    dayOfWeek: DayOfWeek,
    hourUTC: number,
    minuteUTC: number,
    fromDate: Date = new Date()
): number {
    const daysMap: Record<DayOfWeek, number> = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
    };

    const targetDay = daysMap[dayOfWeek];
    const now = new Date(fromDate);
    const currentDay = now.getUTCDay();

    // Calculate days until target day
    let daysUntilTarget = targetDay - currentDay;
    
    // If target day is today or in the past this week, schedule for next week
    if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
    }

    // Create the target date
    const targetDate = new Date(now);
    targetDate.setUTCDate(now.getUTCDate() + daysUntilTarget);
    targetDate.setUTCHours(hourUTC, minuteUTC, 0, 0);

    return targetDate.getTime();
}

/**
 * Helper to check if a booking should be created this week
 * Used by cron jobs
 */
export function _shouldCreateBookingThisWeek(
    lastBookingCreatedAt: number | undefined,
    now: Date = new Date()
): boolean {
    if (!lastBookingCreatedAt) {
        return true; // First time, create a booking
    }

    const lastCreated = new Date(lastBookingCreatedAt);
    const currentWeekStart = getWeekStart(now);
    const lastCreatedWeekStart = getWeekStart(lastCreated);

    // Create a booking if we haven't created one this week yet
    return currentWeekStart.getTime() > lastCreatedWeekStart.getTime();
}

/**
 * Helper to get the start of the current week (Monday 00:00 UTC)
 */
function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday
    d.setUTCDate(d.getUTCDate() + diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}
