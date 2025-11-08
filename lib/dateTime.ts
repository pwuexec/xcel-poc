/**
 * Centralized date/time utilities for UK timezone handling
 * 
 * IMPORTANT:
 * - Backend stores ALL timestamps in UTC (milliseconds since epoch)
 * - Frontend displays ALL times in UK timezone (Europe/London)
 * - This file provides utilities to convert between the two
 */

const UK_TIMEZONE = 'Europe/London';

/**
 * Format a UTC timestamp to UK date (short format)
 * @param timestamp - Unix timestamp in milliseconds (UTC)
 * @returns Formatted date string (e.g., "15 Nov 2025")
 */
export function formatUKDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-GB', {
        timeZone: UK_TIMEZONE,
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Format a UTC timestamp to UK time (24-hour format)
 * @param timestamp - Unix timestamp in milliseconds (UTC)
 * @returns Formatted time string (e.g., "14:30")
 */
export function formatUKTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-GB', {
        timeZone: UK_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

/**
 * Format a UTC timestamp to UK date and time (short)
 * @param timestamp - Unix timestamp in milliseconds (UTC)
 * @returns Formatted date and time string (e.g., "15 Nov at 14:30")
 */
export function formatUKDateTime(timestamp: number): string {
    const date = new Date(timestamp).toLocaleDateString('en-GB', {
        timeZone: UK_TIMEZONE,
        day: 'numeric',
        month: 'short',
    });
    const time = formatUKTime(timestamp);
    return `${date} at ${time}`;
}

/**
 * Format a UTC timestamp to full UK date and time
 * @param timestamp - Unix timestamp in milliseconds (UTC)
 * @returns Formatted date and time string (e.g., "Monday, 15 November 2025 at 14:30")
 */
export function formatUKDateTimeFull(timestamp: number): string {
    const date = new Date(timestamp).toLocaleDateString('en-GB', {
        timeZone: UK_TIMEZONE,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const time = formatUKTime(timestamp);
    return `${date} at ${time}`;
}

/**
 * Format a UTC timestamp to UK time with 12-hour format
 * @param timestamp - Unix timestamp in milliseconds (UTC)
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatUKTime12Hour(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-GB', {
        timeZone: UK_TIMEZONE,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Convert UK local date and time to UTC timestamp
 * 
 * @param date - Date object (year/month/day)
 * @param timeString - Time in HH:MM or HH:MM:SS format (UK local time)
 * @returns UTC timestamp in milliseconds
 * 
 * @example
 * // User selects "2025-11-15" and "14:30" in UK
 * // During BST (British Summer Time): UTC = 13:30
 * // During GMT: UTC = 14:30
 * const timestamp = ukDateTimeToUTC(new Date('2025-11-15'), '14:30');
 */
export function ukDateTimeToUTC(date: Date, timeString: string): number {
    const [hours, minutes, seconds = '00'] = timeString.split(':');
    
    // Get date components
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    const day = date.getDate();
    
    // Parse time components
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    const second = parseInt(seconds, 10);
    
    // Create a date string in ISO format for the UK timezone
    // We'll use Intl.DateTimeFormat to properly handle DST transitions
    const ukDateTimeStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
    
    // Method: Create a date at UTC, check what it shows in UK time, compute offset
    const utcDate = new Date(`${ukDateTimeStr}Z`); // Assume UTC first
    
    // See what time this UTC timestamp shows in UK timezone
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: UK_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const parts = formatter.formatToParts(utcDate);
    const ukYear = parseInt(parts.find(p => p.type === 'year')!.value);
    const ukMonth = parseInt(parts.find(p => p.type === 'month')!.value);
    const ukDay = parseInt(parts.find(p => p.type === 'day')!.value);
    const ukHour = parseInt(parts.find(p => p.type === 'hour')!.value);
    const ukMinute = parseInt(parts.find(p => p.type === 'minute')!.value);
    const ukSecond = parseInt(parts.find(p => p.type === 'second')!.value);
    
    // Calculate the difference
    const intendedTime = Date.UTC(year, month, day, hour, minute, second);
    const ukTime = Date.UTC(ukYear, ukMonth - 1, ukDay, ukHour, ukMinute, ukSecond);
    const offset = intendedTime - ukTime;
    
    // Apply offset to get correct UTC timestamp
    return utcDate.getTime() + offset;
}

/**
 * Get current time in UK timezone
 * @returns Current date/time in UK timezone
 */
export function getCurrentUKTime(): Date {
    const now = new Date();
    const ukTimeStr = now.toLocaleString('en-US', { timeZone: UK_TIMEZONE });
    return new Date(ukTimeStr);
}

/**
 * Check if a timestamp is in the past (UK timezone)
 * @param timestamp - Unix timestamp in milliseconds (UTC)
 * @returns true if the timestamp is in the past (UK time)
 */
export function isInPastUK(timestamp: number): boolean {
    const now = getCurrentUKTime().getTime();
    return timestamp < now;
}

/**
 * Check if a UK date and time combination is in the past
 * @param date - Date object
 * @param timeString - Time in HH:MM or HH:MM:SS format
 * @returns true if the date/time is in the past (UK time)
 */
export function isUKDateTimeInPast(date: Date, timeString: string): boolean {
    const timestamp = ukDateTimeToUTC(date, timeString);
    return isInPastUK(timestamp);
}

/**
 * Convert UTC hour/minute to UK time display string
 * Useful for recurring rules which store hourUTC/minuteUTC
 * 
 * @param hourUTC - Hour in UTC (0-23)
 * @param minuteUTC - Minute in UTC (0-59)
 * @returns Formatted UK time string with timezone note
 * 
 * @example
 * formatUTCHourMinuteToUK(14, 30) // "14:30 (UK time may vary with BST/GMT)"
 */
export function formatUTCHourMinuteToUK(hourUTC: number, minuteUTC: number): string {
    // Create a date at a known time to check offset
    // We use a recent date to get current DST status
    const referenceDate = new Date();
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const day = referenceDate.getDate();
    
    // Create UTC timestamp
    const utcTimestamp = Date.UTC(year, month, day, hourUTC, minuteUTC, 0);
    
    // Format in UK timezone
    const ukTime = new Date(utcTimestamp).toLocaleTimeString('en-GB', {
        timeZone: UK_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    return ukTime;
}
