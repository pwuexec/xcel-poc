# Bookings Shared Components# Shared Booking Components



This directory contains **shared components** used across multiple booking-related pages (main bookings list, create booking, reschedule booking, etc.).This directory contains reusable components for booking creation and rescheduling.



## Organization Principle## Timezone Handling



**Only components used by 2+ pages should be here.** Page-specific components belong in their respective page's `_components` folder.**CRITICAL: All timezone conversions happen at the boundary between frontend and backend.**



## Shared Components### Frontend (Europe/London)

- All user interactions are in UK timezone

### Form Components- Date picker shows UK dates

- **`DatePicker.tsx`** - Calendar date picker with UK timezone support- Time slots are displayed in UK time

- **`TimePicker.tsx`** - Time input picker- Validation of "past" times uses UK timezone

- **`TimeSlotPicker.tsx`** - Available time slots selector with busy periods

- **`BookingConfirmation.tsx`** - Booking summary/confirmation card### Backend (UTC)

- All timestamps stored in UTC (milliseconds since epoch)

### Feature Components  - All comparisons and calculations in UTC

- **`BookingChat.tsx`** - Chat interface for booking discussions (used in main list)- Only error messages format times in UK timezone for user display

- **`PaymentButton.tsx`** - Stripe payment integration button (used in main list)

- **`VideoCall.tsx`** - Video call integration hook (used in main list)### Conversion Flow

- **`BookingStatusFilter.tsx`** - Status filter tabs (used in main list)1. User selects date and time in UK timezone

2. Frontend converts to UTC timestamp using `ukDateTimeToUTC()`

### Utilities3. Backend receives UTC timestamp

- **`utils.ts`** - Shared helper functions:4. Backend stores and validates in UTC

  - `formatBookingDateTime()` - Format dates in UK timezone5. When displaying, format UTC back to UK timezone

  - `formatTimeRange()` - Format time ranges

  - `isBookingDateTimeValid()` - Validate booking time is not in past## Components

  - `ukDateTimeToUTC()` - Convert UK datetime to UTC timestamp

- **`index.ts`** - Barrel exports for clean imports### DatePicker

Natural language date picker with calendar support.

## Directory Structure

**Features:**

```- Natural language input (e.g., "tomorrow", "next week")

app/(public)/bookings/- Calendar dropdown with month/year selection

├── _components/          # ← SHARED components (this folder)- Prevents selection of past dates (UK timezone)

│   ├── BookingChat.tsx- Arrow down key to open calendar

│   ├── DatePicker.tsx

│   ├── TimeSlotPicker.tsx**Props:**

│   └── ...```typescript

├── new/{

│   ├── _components/      # ← NEW PAGE specific components  value: Date | undefined;

│   │   ├── UserSelector.tsx  onChange: (date: Date | undefined) => void;

│   │   └── BookingTypeDisplay.tsx  label?: string; // Default: "Schedule Date"

│   └── page.tsx}

├── reschedule/```

│   └── page.tsx          # Uses shared _components

├── BookingsClient.tsx    # Main bookings list (uses shared _components)### TimePicker

└── page.tsxTime input component with custom styling.

```

**Features:**

## Usage- 24-hour time format with seconds

- Custom styled input (hides calendar picker icon)

Import shared components from the shared folder:- Consistent design with DatePicker



```tsx**Props:**

// In any booking page```typescript

import { DatePicker, TimeSlotPicker, BookingConfirmation } from "../_components";{

```  value: string;

  onChange: (time: string) => void;

## When to Add a Component Here  label?: string; // Default: "Time"

}

✅ **Add here if:**```

- Used by 2+ different booking pages

- Generic/reusable across booking flows### TimeSlotPicker

- Core booking functionality (dates, times, confirmations)Displays available time slots in 5-minute intervals.



❌ **Don't add here if:****Features:**

- Only used by one page (put in that page's `_components`)- Grid layout of available times

- Page-specific business logic- Visual distinction for busy slots

- Tightly coupled to a specific flow- Click to select

- Loading state

## Timezone Handling

**Props:**

**CRITICAL: All timezone conversions happen at the boundary between frontend and backend.**```typescript

{

### Frontend (Europe/London)  availableSlots: string[];      // ["09:00:00", "09:05:00", ...]

- All user interactions are in UK timezone  busySlots: string[];           // ["10:00:00", "10:05:00", ...]

- Date picker shows UK dates  selectedTime: string;

- Time slots are displayed in UK time  onSelectTime: (time: string) => void;

- Validation of "past" times uses UK timezone  label?: string;

  isLoading?: boolean;

### Backend (UTC)}

- All timestamps stored in UTC (milliseconds since epoch)```

- All comparisons and calculations in UTC

- Only error messages format times in UK timezone for user display## Utilities



### Conversion Flow### formatBookingDateTime

1. User selects date and time in UK timezoneFormats a date and time into a readable UK timezone string.

2. Frontend converts to UTC timestamp using `ukDateTimeToUTC()`

3. Backend receives UTC timestamp```typescript

4. Backend stores and validates in UTCformatBookingDateTime(date: Date | undefined, time: string): string

5. When displaying, format UTC back to UK timezone// Returns: "Friday, 8 November 2025 at 2:30 PM"

```

## Component Details

### isBookingDateTimeValid

### DatePickerValidates that a booking date/time is in the future (UK timezone).

Calendar-based date picker.

```typescript

**Props:**isBookingDateTimeValid(date: Date | undefined, time: string): boolean

```typescript```

{

  value: Date | undefined;### ukDateTimeToUTC

  onChange: (date: Date | undefined) => void;Converts UK timezone date/time to UTC timestamp.

  label?: string; // Default: "Schedule Date"

}```typescript

```ukDateTimeToUTC(date: Date, time: string): number

// Example: ukDateTimeToUTC(new Date('2025-11-08'), '14:30:00')

### TimeSlotPicker// Returns: 1731078600000 (UTC timestamp)

Displays available time slots in 5-minute intervals.```



**Props:****How it works:**

```typescript1. Creates a UTC timestamp with the given date/time values

{2. Formats that timestamp in UK timezone to see what time it represents

  availableSlots: string[];3. Calculates the offset between intended UK time and actual UK time

  busySlots: string[];4. Adjusts the UTC timestamp by this offset

  selectedTime: string;5. Returns the correct UTC timestamp for the UK local time

  onSelectTime: (time: string) => void;

  label?: string;## Usage

  isLoading?: boolean;

  bookingDurationMinutes?: number;These components are used in:

}- `CreateBookingForm.tsx` - For creating new bookings

```- `RescheduleBookingForm.tsx` - For rescheduling existing bookings



### Utility FunctionsBoth forms share the same validation logic and design patterns.



**`ukDateTimeToUTC(date: Date, time: string): number`**## Backend Validation

- Converts UK timezone date/time to UTC timestamp

- Used when submitting bookings to backendSee `/convex/bookings/cases/_validateBookingTimestamp.ts` for backend validation that ensures:

1. Timestamps are not in the past (UTC comparison)

**`isBookingDateTimeValid(date: Date | undefined, time: string): boolean`**2. No time conflicts with existing bookings (UTC comparison)

- Validates that a booking date/time is in the future (UK timezone)3. Error messages formatted in UK timezone for display

- Prevents creating bookings in the past
