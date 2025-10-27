# Convex Best Practices Implementation

This project follows Convex best practices as documented in:
- https://docs.convex.dev/understanding/best-practices/
- https://docs.convex.dev/understanding/best-practices/typescript

## Architecture

### Helper Functions (convex/model/)

Following the best practice to **use helper functions for shared code**, most business logic is now organized in the `convex/model/` directory:

- **`convex/model/users.ts`** - User authentication and authorization helpers
- **`convex/model/bookings.ts`** - Booking business logic and validators
- **`convex/model/messages.ts`** - Messaging functionality
- **`convex/model/payments.ts`** - Payment processing helpers

### Public API (convex/schemas/)

The public API in `convex/schemas/` is kept thin, primarily:
- Defining table schemas
- Validating arguments with validators
- Checking authentication
- Calling helper functions from `convex/model/`

This organization makes the code:
- **Easier to test** - Helper functions can be tested independently
- **More reusable** - Logic can be shared between queries, mutations, and actions
- **Better for refactoring** - Changes to business logic don't affect the public API surface

## TypeScript Type Inference from Validators

### Using `Infer` Type

Instead of manually defining types, we use TypeScript's `Infer` utility to derive types from Convex validators:

```typescript
import { Infer, v } from "convex/values";

// Define validator
export const bookingStatus = v.union(
    v.literal("pending"),
    v.literal("awaiting_payment"),
    v.literal("confirmed"),
    // ...
);

// Infer TypeScript type from validator
export type BookingStatus = Infer<typeof bookingStatus>;
```

This approach ensures:
- **Single source of truth** - The validator is the source of truth for both runtime validation and TypeScript types
- **Type safety** - TypeScript types automatically match runtime validators
- **No duplication** - Don't need to maintain both validators and separate type definitions

### Examples in the Codebase

#### Bookings (`convex/model/bookings.ts`)

```typescript
export const bookingStatus = v.union(...);
export type BookingStatus = Infer<typeof bookingStatus>;

export const bookingEvent = v.object({...});
export type BookingEvent = Infer<typeof bookingEvent>;
```

#### Payments (`convex/model/payments.ts`)

```typescript
export const paymentStatus = v.union(...);
export type PaymentStatus = Infer<typeof paymentStatus>;
```

#### Users (`convex/schemas/users.ts`)

```typescript
export const role = v.union(v.literal("user"), v.literal("tutor"), v.literal("admin"));
export type Role = Infer<typeof role>;
```

## Benefits

### 1. Helper Functions

**Before:**
```typescript
export const createBooking = mutation({
    handler: async (ctx, args) => {
        // 50+ lines of validation and business logic
        const currentUser = await getCurrentUserOrThrow(ctx);
        const toUser = await getUserByIdOrThrow(ctx, args.toUserId);
        // ... lots more logic
    }
})
```

**After:**
```typescript
export const createBooking = mutation({
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        await Bookings.createBookingHelper(ctx, {
            fromUserId: currentUser._id,
            toUserId: args.toUserId,
            timestamp: args.timestamp,
        });
    }
})
```

### 2. Type Inference

**Before:**
```typescript
// Define validator
export const bookingStatus = v.union(v.literal("pending"), v.literal("confirmed"));

// Separately define type (duplication!)
export type BookingStatus = "pending" | "confirmed";

// Types can get out of sync if validator changes
```

**After:**
```typescript
// Define validator
export const bookingStatus = v.union(v.literal("pending"), v.literal("confirmed"));

// Automatically infer type from validator
export type BookingStatus = Infer<typeof bookingStatus>;

// Types always match validators!
```

## Structure

```
convex/
├── model/              # Helper functions (business logic)
│   ├── users.ts        # User-related helpers
│   ├── bookings.ts     # Booking helpers + validators + types
│   ├── messages.ts     # Message helpers
│   └── payments.ts     # Payment helpers + validators + types
├── schemas/            # Table definitions and public API
│   ├── users.ts        # Users table + auth queries/mutations
│   ├── bookings.ts     # Bookings table + queries/mutations
│   ├── messages.ts     # Messages table + queries/mutations
│   ├── payments.ts     # Payments table + internal mutations
│   └── admin.ts        # Admin functionality
└── schema.ts           # Main schema export
```

## Key Patterns

### 1. Validators and Types Live Together

Validators and their inferred types are defined in the same module (in `convex/model/`) and re-exported from schema files:

```typescript
// convex/model/bookings.ts
export const bookingStatus = v.union(...);
export type BookingStatus = Infer<typeof bookingStatus>;

// convex/schemas/bookings.ts
export { bookingStatus } from "../model/bookings";
export type { BookingStatus } from "../model/bookings";
```

### 2. Helper Functions Accept ctx + args

All helper functions follow a consistent pattern:

```typescript
export async function helperFunction(
    ctx: MutationCtx | QueryCtx,
    args: {
        userId: Id<"users">;
        bookingId: Id<"bookings">;
        // ... other args
    }
) {
    // Business logic here
}
```

### 3. Public Functions Are Thin Wrappers

Public queries/mutations:
1. Validate arguments (using validators)
2. Get current user (if needed)
3. Call helper function
4. Return result

```typescript
export const acceptBooking = mutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        await Bookings.acceptBookingHelper(ctx, {
            bookingId: args.bookingId,
            userId: currentUser._id,
        });
    }
})
```

## Further Reading

- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/)
- [TypeScript Type Inference](https://docs.convex.dev/understanding/best-practices/typescript#inferring-types-from-validators)
- [Helper Functions](https://docs.convex.dev/understanding/best-practices/#use-helper-functions-to-write-shared-code)
