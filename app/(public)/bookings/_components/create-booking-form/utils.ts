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
