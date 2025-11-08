# New Booking Page Components

This directory contains components **specific to the "Create New Booking" page** (`/bookings/new`).

## Components

### UserSelector.tsx
Dropdown selector for choosing a tutor or student to book with.

**Features:**
- Filters users based on current user's role (tutors see students, students see tutors)
- Search/filter functionality
- Displays user avatars and names

**Props:**
```typescript
{
  value: string;
  onChange: (value: string) => void;
  users: User[] | undefined;
  label: string;
  placeholder: string;
}
```

### BookingTypeDisplay.tsx
Displays booking eligibility and type selection (Free Trial vs Paid Session).

**Features:**
- Shows available booking types based on eligibility
- Displays remaining free bookings
- Shows pricing information
- Explains constraints (e.g., one free booking at a time)

**Props:**
```typescript
{
  eligibility: BookingEligibility;
  isTutor: boolean;
}
```

### utils.ts
Helper functions specific to booking creation flow.

## Why These Components Are Here

These components are **NOT shared** because they:
- ❌ Only used in the create booking flow
- ❌ Have specific business logic for booking creation
- ❌ Not reusable in reschedule or other booking flows

For **shared** booking components (DatePicker, TimeSlotPicker, etc.), see `../_components/`.

## Usage

```tsx
import { UserSelector, BookingTypeDisplay } from "./_components";
```

## Related

- Parent page: `../page.tsx` (Create New Booking)
- Shared components: `../_components/` (DatePicker, TimeSlotPicker, etc.)
