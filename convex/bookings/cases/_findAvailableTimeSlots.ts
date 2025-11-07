import { QueryCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { BookingType } from "../types/bookingType";
import { getBookingDuration } from "./_getBookingDuration";

/**
 * Find available time slots for a given date and users
 * Server works in UTC, frontend handles UK timezone conversion
 * Returns suggestions in 5-minute intervals
 */
export async function _findAvailableTimeSlots(
    ctx: QueryCtx,
    args: {
        date: string; // YYYY-MM-DD in UK timezone from frontend
        fromUserId: Id<"users">;
        toUserId: Id<"users">;
        bookingType: BookingType;
        excludeBookingId?: Id<"bookings">;
    }
): Promise<{
    availableSlots: string[]; // Array of time strings "HH:MM"
    busySlots: Array<{ start: string; end: string; user: string }>;
}> {
    const duration = getBookingDuration(args.bookingType);
    
    // Get all bookings for both users
    const allBookings = await ctx.db.query("bookings").collect();
    
    // The date comes from frontend in UK timezone format (YYYY-MM-DD)
    // We need to convert to UTC timestamp range for comparison
    // Start of day: args.date 00:00:00 UK time
    // End of day: args.date 23:59:59 UK time
    const ukDateStart = new Date(`${args.date}T00:00:00`).getTime();
    const ukDateEnd = new Date(`${args.date}T23:59:59`).getTime();
    
    // Filter relevant bookings
    const relevantBookings = allBookings.filter((booking) => {
        if (args.excludeBookingId && booking._id === args.excludeBookingId) {
            return false;
        }
        
        if (!["pending", "accepted", "completed"].includes(booking.status)) {
            return false;
        }
        
        // Server stores timestamps in UTC (milliseconds)
        // Check if booking falls within the UK date range
        const bookingTimestamp = booking.timestamp;
        
        // Booking must start within the selected UK date
        if (bookingTimestamp < ukDateStart || bookingTimestamp > ukDateEnd) {
            return false;
        }
        
        // Check if involves either user
        const involvesFromUser = 
            booking.fromUserId === args.fromUserId || booking.toUserId === args.fromUserId;
        const involvesToUser = 
            booking.fromUserId === args.toUserId || booking.toUserId === args.toUserId;
        
        return involvesFromUser || involvesToUser;
    });
    
    // Create busy slots
    const busySlots: Array<{ start: string; end: string; user: string }> = [];
    const busyRanges: Array<{ start: number; end: number }> = [];
    
    for (const booking of relevantBookings) {
        const bookingDuration = getBookingDuration(booking.bookingType);
        const start = booking.timestamp; // UTC timestamp
        const end = start + bookingDuration;
        
        busyRanges.push({ start, end });
        
        // Format times for display (frontend will handle UK timezone display)
        // Return in HH:MM format, frontend will interpret in UK timezone
        const startDate = new Date(start);
        const startTime = `${startDate.getUTCHours().toString().padStart(2, '0')}:${startDate.getUTCMinutes().toString().padStart(2, '0')}`;
        
        const endDate = new Date(end);
        const endTime = `${endDate.getUTCHours().toString().padStart(2, '0')}:${endDate.getUTCMinutes().toString().padStart(2, '0')}`;
        
        const user = 
            booking.fromUserId === args.fromUserId || booking.toUserId === args.fromUserId
                ? "You"
                : "The other user";
        
        busySlots.push({ start: startTime, end: endTime, user });
    }
    
    // Generate available slots in 5-minute intervals
    // Working hours: 8:00 AM to 8:00 PM UK time
    const availableSlots: string[] = [];
    const startHour = 8;
    const endHour = 20;
    
    // Get current time in UTC
    const nowUTC = Date.now();
    
    // Check if selected date is today in UK timezone
    const nowInUK = new Date().toLocaleDateString("en-CA", {
        timeZone: "Europe/London"
    });
    const isToday = nowInUK === args.date;
    
    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 5) {
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
            
            // Create UTC timestamp for this UK date/time
            // args.date is YYYY-MM-DD representing a UK date
            // timeStr is HH:MM:SS representing UK time
            // We need to convert this UK local time to UTC timestamp
            const [year, month, day] = args.date.split('-').map(Number);
            const slotStart = Date.UTC(year, month - 1, day, hour, minute, 0);
            
            // Find the UK timezone offset for this specific date/time
            const testDate = new Date(slotStart);
            const ukTime = testDate.toLocaleString('en-US', {
                timeZone: 'Europe/London',
                hour12: false
            });
            const utcTime = testDate.toLocaleString('en-US', {
                timeZone: 'UTC',
                hour12: false
            });
            const ukMs = new Date(ukTime).getTime();
            const utcMs = new Date(utcTime).getTime();
            const offsetMs = utcMs - ukMs;
            
            // Apply offset to get correct UTC timestamp for UK local time
            const slotStartUTC = slotStart + offsetMs;
            const slotEnd = slotStartUTC + duration;
            
            // Skip if in the past (only check if it's today in UK timezone)
            if (isToday && slotStartUTC <= nowUTC) {
                continue;
            }
            
            // Check if the booking end time would go beyond working hours
            // Calculate end time in UK timezone
            const endHourUK = hour;
            const endMinuteUK = minute + (duration / 60000);
            const totalMinutes = endHourUK * 60 + endMinuteUK;
            const endTotalMinutes = endHour * 60; // 20:00 = 1200 minutes
            
            // Skip if booking would end after 8 PM UK time (20:00)
            if (totalMinutes > endTotalMinutes) {
                continue;
            }
            
            // Check if slot conflicts with any busy range (all in UTC)
            let hasConflict = false;
            for (const busy of busyRanges) {
                const overlaps = 
                    (slotStartUTC >= busy.start && slotStartUTC < busy.end) ||
                    (slotEnd > busy.start && slotEnd <= busy.end) ||
                    (slotStartUTC <= busy.start && slotEnd >= busy.end);
                
                if (overlaps) {
                    hasConflict = true;
                    break;
                }
            }
            
            if (!hasConflict) {
                const displayTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                availableSlots.push(displayTime);
            }
        }
    }
    
    return {
        availableSlots,
        busySlots,
    };
}
