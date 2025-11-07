# Shared Booking Components

This directory contains reusable components for booking creation and rescheduling.

## Timezone Handling

**CRITICAL: All timezone conversions happen at the boundary between frontend and backend.**

### Frontend (Europe/London)
- All user interactions are in UK timezone
- Date picker shows UK dates
- Time slots are displayed in UK time
- Validation of "past" times uses UK timezone

### Backend (UTC)
- All timestamps stored in UTC (milliseconds since epoch)
- All comparisons and calculations in UTC
- Only error messages format times in UK timezone for user display

### Conversion Flow
1. User selects date and time in UK timezone
2. Frontend converts to UTC timestamp using `ukDateTimeToUTC()`
3. Backend receives UTC timestamp
4. Backend stores and validates in UTC
5. When displaying, format UTC back to UK timezone

## Components

### DatePicker
Natural language date picker with calendar support.

**Features:**
- Natural language input (e.g., "tomorrow", "next week")
- Calendar dropdown with month/year selection
- Prevents selection of past dates (UK timezone)
- Arrow down key to open calendar

**Props:**
```typescript
{
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label?: string; // Default: "Schedule Date"
}
```

### TimePicker
Time input component with custom styling.

**Features:**
- 24-hour time format with seconds
- Custom styled input (hides calendar picker icon)
- Consistent design with DatePicker

**Props:**
```typescript
{
  value: string;
  onChange: (time: string) => void;
  label?: string; // Default: "Time"
}
```

### TimeSlotPicker
Displays available time slots in 5-minute intervals.

**Features:**
- Grid layout of available times
- Visual distinction for busy slots
- Click to select
- Loading state

**Props:**
```typescript
{
  availableSlots: string[];      // ["09:00:00", "09:05:00", ...]
  busySlots: string[];           // ["10:00:00", "10:05:00", ...]
  selectedTime: string;
  onSelectTime: (time: string) => void;
  label?: string;
  isLoading?: boolean;
}
```

## Utilities

### formatBookingDateTime
Formats a date and time into a readable UK timezone string.

```typescript
formatBookingDateTime(date: Date | undefined, time: string): string
// Returns: "Friday, 8 November 2025 at 2:30 PM"
```

### isBookingDateTimeValid
Validates that a booking date/time is in the future (UK timezone).

```typescript
isBookingDateTimeValid(date: Date | undefined, time: string): boolean
```

### ukDateTimeToUTC
Converts UK timezone date/time to UTC timestamp.

```typescript
ukDateTimeToUTC(date: Date, time: string): number
// Example: ukDateTimeToUTC(new Date('2025-11-08'), '14:30:00')
// Returns: 1731078600000 (UTC timestamp)
```

**How it works:**
1. Creates a UTC timestamp with the given date/time values
2. Formats that timestamp in UK timezone to see what time it represents
3. Calculates the offset between intended UK time and actual UK time
4. Adjusts the UTC timestamp by this offset
5. Returns the correct UTC timestamp for the UK local time

## Usage

These components are used in:
- `CreateBookingForm.tsx` - For creating new bookings
- `RescheduleBookingForm.tsx` - For rescheduling existing bookings

Both forms share the same validation logic and design patterns.

## Backend Validation

See `/convex/bookings/cases/_validateBookingTimestamp.ts` for backend validation that ensures:
1. Timestamps are not in the past (UTC comparison)
2. No time conflicts with existing bookings (UTC comparison)
3. Error messages formatted in UK timezone for display
