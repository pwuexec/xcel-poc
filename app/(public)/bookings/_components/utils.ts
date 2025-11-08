/**
 * Format a date and time into a readable UK time string
 */
export function formatBookingDateTime(date: Date | undefined, time: string): string {
    if (!date || !time) return "";

    const dateStr = date.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    // Convert 24-hour time to 12-hour format
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    const timeStr = `${hour12}:${minutes} ${ampm}`;

    return `${dateStr} at ${timeStr}`;
}

/**
 * Format a timestamp to UK date (short format)
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string (e.g., "15 Nov")
 */
export function formatUKDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-GB', {
        timeZone: 'Europe/London',
        day: 'numeric',
        month: 'short'
    });
}

/**
 * Format a timestamp to UK time (24-hour format)
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string (e.g., "14:30")
 */
export function formatUKTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

/**
 * Format a timestamp to UK date and time
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date and time string (e.g., "15 Nov at 14:30")
 */
export function formatUKDateTime(timestamp: number): string {
    return `${formatUKDate(timestamp)} at ${formatUKTime(timestamp)}`;
}

/**
 * Format a time range showing start and end time
 * @param time - Start time in HH:MM or HH:MM:SS format (24-hour)
 * @param durationMinutes - Duration in minutes
 */
export function formatTimeRange(time: string, durationMinutes: number): string {
    if (!time) return "";

    const [hours, minutes] = time.split(":");
    const startHour = parseInt(hours, 10);
    const startMinute = parseInt(minutes, 10);
    
    // Calculate end time
    const totalMinutes = startHour * 60 + startMinute + durationMinutes;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    
    // Format times in 12-hour format
    const formatTime12 = (hour: number, minute: number) => {
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
    };
    
    return `${formatTime12(startHour, startMinute)} - ${formatTime12(endHour, endMinute)}`;
}

/**
 * Convert UK timezone date and time to UTC timestamp
 * Frontend works in Europe/London timezone, server works in UTC
 * 
 * This uses a simple technique: create a formatted string that toLocaleString
 * can parse, then use that to find the UK time, and compute the offset.
 * 
 * @param date - Date object representing the UK date
 * @param time - Time string in HH:MM or HH:MM:SS format (UK time)
 * @returns UTC timestamp in milliseconds
 */
export function ukDateTimeToUTC(date: Date, time: string): number {
    const [hours, minutes, seconds = "00"] = time.split(":");
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Create a Date string: we'll create a UTC date first, then adjust
    const year = parseInt(dateStr.split('-')[0]);
    const month = parseInt(dateStr.split('-')[1]) - 1; // 0-indexed for Date()
    const day = parseInt(dateStr.split('-')[2]);
    const hour = parseInt(hours);
    const minute = parseInt(minutes);
    const second = parseInt(seconds);
    
    // Step 1: Create a UTC timestamp with these values
    const utcTimestamp = Date.UTC(year, month, day, hour, minute, second);
    
    // Step 2: Find out what time this UTC timestamp represents in UK timezone
    const ukTimeStr = new Date(utcTimestamp).toLocaleString('en-US', {
        timeZone: 'Europe/London',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    // Parse the UK time string (format: "MM/DD/YYYY, HH:MM:SS")
    const [ukDatePart, ukTimePart] = ukTimeStr.split(', ');
    const [ukMonth, ukDay, ukYear] = ukDatePart.split('/').map(Number);
    const [ukHour, ukMinute, ukSecond] = ukTimePart.split(':').map(Number);
    
    // Step 3: Calculate the difference between our intended UK time and what the UTC timestamp shows in UK
    const intendedUKMs = (hour * 3600 + minute * 60 + second) * 1000;
    const actualUKMs = (ukHour * 3600 + ukMinute * 60 + ukSecond) * 1000;
    const offsetMs = intendedUKMs - actualUKMs;
    
    // Step 4: Adjust the UTC timestamp
    return utcTimestamp + offsetMs;
}

/**
 * Validate that the booking date/time is not in the past (UK timezone)
 */
export function isBookingDateTimeValid(date: Date | undefined, time: string): boolean {
    if (!date || !time) return false;

    // Get current UK time
    const now = new Date();
    const ukNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/London" }));

    // Create booking datetime
    const dateStr = date.toISOString().split('T')[0];
    const bookingDateTime = new Date(`${dateStr}T${time}`);

    return bookingDateTime > ukNow;
}
