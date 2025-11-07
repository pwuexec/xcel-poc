# Booking Timestamp Validation

This helper validates booking timestamps for both creation and rescheduling operations.

## Location
`/convex/bookings/cases/_validateBookingTimestamp.ts`

## Purpose
Centralizes validation logic to ensure:
1. **No Past Bookings**: Timestamps must be in the future
2. **No Time Conflicts**: Prevents double-booking for tutors and students

## Usage

### In Create Booking
```typescript
await _validateBookingTimestamp(ctx, {
    timestamp: args.timestamp,
    fromUserId: args.fromUserId,
    toUserId: args.toUserId,
});
```

### In Reschedule Booking
```typescript
await _validateBookingTimestamp(ctx, {
    timestamp: args.newTimestamp,
    fromUserId: booking.fromUserId,
    toUserId: booking.toUserId,
    excludeBookingId: args.bookingId, // Exclude current booking from conflict check
});
```

## Validation Rules

### 1. Past Date Prevention
Compares the requested timestamp with `Date.now()`. Throws error if in the past.

### 2. Time Conflict Detection
- **Booking Duration**: 1 hour (configurable via `BOOKING_DURATION` constant)
- **Checked Statuses**: `pending`, `accepted`, `completed`
- **Excluded Statuses**: `canceled`, `rejected`
- **Overlap Detection**: Checks if new booking overlaps with existing bookings
- **Users Checked**: Both `fromUserId` and `toUserId`

### Error Messages

**Past Date:**
```
Cannot create a booking in the past. Please select a future date and time.
```

**Time Conflict:**
```
You already have a booking at this time. 
Existing booking: Friday, 8 November 2025, 14:30. 
Please choose a different time.
```

## Configuration

To change the booking duration, modify the `BOOKING_DURATION` constant:
```typescript
const BOOKING_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
```

## Used By
- `_createBookingMutation.ts`
- `_rescheduleBookingMutation.ts`

This ensures consistent validation across all booking operations.
