# Convex Architecture Guide

This document outlines the architecture patterns used in this project for building features with Convex.

## Directory Structure

Each feature module follows a consistent structure:

```
convex/
└── [feature]/
    ├── cases/
    │   ├── mutations/
    │   │   └── _[action]Mutation.ts
    │   ├── queries/
    │   │   └── _[action]Query.ts
    │   └── _[helper].ts
    ├── integrations/
    │   ├── actions.ts
    │   ├── crons.ts (optional)
    │   ├── httpActions.ts (optional)
    │   ├── reads.ts
    │   └── writes.ts
    ├── types/
    │   └── [type].ts
    └── schema.ts
```

## Core Principles

### 1. Separation of Concerns

- **`cases/`**: Business logic (pure functions, reusable)
- **`integrations/`**: External interfaces (public APIs, internal APIs)
- **`types/`**: Type definitions and validators
- **`schema.ts`**: Database schema definitions

### 2. Naming Conventions

#### Files
- Mutations: `_[action]Mutation.ts` (e.g., `_createBookingMutation.ts`)
- Queries: `_[action]Query.ts` (e.g., `_getUserBookingsQuery.ts`)
- Helpers: `_[name].ts` (e.g., `_validateAccess.ts`)
- Integration files: `reads.ts`, `writes.ts`, `actions.ts`, etc.

#### Functions
- Mutations: `_[action]Mutation` (e.g., `_createBookingMutation`)
- Queries: `_[action]Query` (e.g., `_getUserBookingsQuery`)
- Helpers: `_[name]` (e.g., `_validateAccess`)
- Public APIs: `[action][Entity]` (e.g., `createBooking`, `getMyBookings`)

### 3. Underscore Prefix Convention

- **Files/functions starting with `_`**: Internal helpers, not directly exposed
- **Files/functions without `_`**: Public APIs or top-level exports

## Layer Breakdown

### Layer 1: Cases (Business Logic)

Contains pure business logic that can be reused across different integration points.

#### Mutations (`cases/mutations/`)

Handle state changes and side effects.

**Example: `_createBookingMutation.ts`**
```typescript
import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { _validateAccess } from "../_validateAccess";

export async function _createBookingMutation(
    ctx: MutationCtx,
    args: {
        userId: Id<"users">;
        data: { /* ... */ };
    }
) {
    // Validation
    await _validateAccess(ctx, args.userId);
    
    // Business logic
    const bookingId = await ctx.db.insert("bookings", {
        ...args.data,
        createdAt: Date.now(),
    });
    
    return bookingId;
}
```

#### Queries (`cases/queries/`)

Fetch and transform data without side effects.

**Example: `_getUserBookingsQuery.ts`**
```typescript
import { QueryCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";

export async function _getUserBookingsQuery(
    ctx: QueryCtx,
    userId: Id<"users">
) {
    // Use efficient index queries
    const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first(); // Use .first() instead of .collect() when possible
    
    return bookings;
}
```

#### Helpers (`cases/`)

Reusable utility functions.

**Example: `_validateAccess.ts`**
```typescript
import { MutationCtx, QueryCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

export async function _validateAccess(
    ctx: MutationCtx | QueryCtx,
    resourceId: Id<"bookings">,
    userId: Id<"users">
) {
    const resource = await ctx.db.get(resourceId);
    
    if (!resource) {
        throw new Error("Resource not found");
    }
    
    if (resource.userId !== userId) {
        throw new Error("Access denied");
    }
    
    return resource;
}
```

### Layer 2: Integrations (External Interfaces)

Public-facing APIs that use the business logic from cases.

#### `reads.ts` (Queries)

Public queries that fetch data.

```typescript
import { v } from "convex/values";
import { query, internalQuery } from "../../_generated/server";
import { getCurrentUserOrThrow } from "../../model/users";
import { _getUserBookingsQuery } from "../cases/queries/_getUserBookingsQuery";

/**
 * Public query to get current user's bookings
 */
export const getMyBookings = query({
    args: {
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        return await _getUserBookingsQuery(ctx, currentUser._id, args.status);
    },
});

/**
 * Internal query for server-side use only
 */
export const getBookingInternal = internalQuery({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.bookingId);
    },
});
```

#### `writes.ts` (Mutations)

Public mutations that modify state.

```typescript
import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import { getCurrentUserOrThrow } from "../../model/users";
import { _createBookingMutation } from "../cases/mutations/_createBookingMutation";

/**
 * Public mutation to create a booking
 */
export const createBooking = mutation({
    args: {
        data: v.object({
            timestamp: v.number(),
            // ... other fields
        }),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        return await _createBookingMutation(ctx, {
            userId: currentUser._id,
            data: args.data,
        });
    },
});

/**
 * Internal mutation for server-side use only
 */
export const updateBookingInternal = internalMutation({
    args: {
        bookingId: v.id("bookings"),
        updates: v.object({ /* ... */ }),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.bookingId, args.updates);
    },
});
```

#### `actions.ts` (Node.js Actions)

For third-party integrations, API calls, or complex operations.

```typescript
"use node";

import { v } from "convex/values";
import { action, internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";

/**
 * Public action to process external API
 */
export const processExternalAPI = action({
    args: {
        data: v.string(),
    },
    handler: async (ctx, args) => {
        // Call external API
        const response = await fetch("https://api.example.com", {
            method: "POST",
            body: args.data,
        });
        
        const result = await response.json();
        
        // Store result in database via mutation
        await ctx.runMutation(internal.feature.integrations.writes.saveResult, {
            result,
        });
        
        return result;
    },
});

/**
 * Internal action for webhooks or scheduled tasks
 */
export const processWebhook = internalAction({
    args: {
        payload: v.string(),
    },
    handler: async (ctx, args) => {
        // Process webhook
        // Call mutations to update state
    },
});
```

#### `httpActions.ts` (HTTP Endpoints)

HTTP endpoints for webhooks or REST APIs.

```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "../../_generated/server";
import { internal } from "../../_generated/api";

const http = httpRouter();

/**
 * Webhook endpoint
 * POST /feature/webhook
 */
http.route({
    path: "/feature/webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const signature = request.headers.get("x-signature");
        const body = await request.text();
        
        // Verify signature
        if (!signature) {
            return new Response("Missing signature", { status: 401 });
        }
        
        // Process webhook via internal action
        await ctx.runAction(internal.feature.integrations.actions.processWebhook, {
            payload: body,
        });
        
        return new Response("OK", { status: 200 });
    }),
});

export default http;
```

#### `crons.ts` (Scheduled Tasks)

Scheduled background jobs.

```typescript
import { cronJobs } from "convex/server";
import { internal } from "../_generated/api";

const crons = cronJobs();

/**
 * Run every hour to cleanup expired items
 */
crons.interval(
    "cleanup expired items",
    { hours: 1 },
    internal.feature.integrations.actions.cleanupExpired
);

/**
 * Run daily at midnight UTC
 */
crons.daily(
    "daily report",
    { hourUTC: 0, minuteUTC: 0 },
    internal.feature.integrations.actions.generateDailyReport
);

export default crons;
```

## Best Practices

### 1. Query Optimization

**❌ Bad: Fetching all records**
```typescript
const allBookings = await ctx.db.query("bookings").collect();
const userBookings = allBookings.filter(b => b.userId === userId);
```

**✅ Good: Using indexes**
```typescript
const userBookings = await ctx.db
    .query("bookings")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
```

**✅ Better: Using .first() when possible**
```typescript
const activeBooking = await ctx.db
    .query("bookings")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("status"), "active"))
    .first(); // Stops after finding first match
```

### 2. Combining Queries

**❌ Bad: Multiple separate queries**
```typescript
const bookings = useQuery(api.feature.reads.getBookings);
const counts = useQuery(api.feature.reads.getCounts);
```

**✅ Good: Single combined query**
```typescript
const data = useQuery(api.feature.reads.getBookingsWithCounts);
// Returns: { bookings: [...], counts: { active: 10, past: 5 } }
```

### 3. Error Handling

Always throw descriptive errors:

```typescript
export async function _validateBooking(ctx: QueryCtx, bookingId: Id<"bookings">) {
    const booking = await ctx.db.get(bookingId);
    
    if (!booking) {
        throw new Error("Booking not found");
    }
    
    if (booking.status === "canceled") {
        throw new Error("Cannot modify a canceled booking");
    }
    
    return booking;
}
```

### 4. Type Safety

Use validators for all public APIs:

```typescript
import { v } from "convex/values";

// Define reusable validators in types/
export const bookingStatus = v.union(
    v.literal("pending"),
    v.literal("confirmed"),
    v.literal("completed"),
    v.literal("canceled")
);

// Use in queries/mutations
export const updateBooking = mutation({
    args: {
        bookingId: v.id("bookings"),
        status: bookingStatus,
    },
    handler: async (ctx, args) => {
        // TypeScript knows args.status is one of the valid values
    },
});
```

### 5. Reusability

Move common logic to helpers:

```typescript
// cases/_getEntityOrThrow.ts
export async function _getEntityOrThrow<T extends TableName>(
    ctx: QueryCtx,
    table: T,
    id: Id<T>
) {
    const entity = await ctx.db.get(id);
    
    if (!entity) {
        throw new Error(`${table} not found`);
    }
    
    return entity;
}

// Use in multiple places
const booking = await _getEntityOrThrow(ctx, "bookings", bookingId);
const user = await _getEntityOrThrow(ctx, "users", userId);
```

## Creating a New Feature

### Step-by-Step Guide

1. **Create directory structure**
   ```bash
   mkdir -p convex/myfeature/{cases/{mutations,queries},integrations,types}
   touch convex/myfeature/schema.ts
   ```

2. **Define schema** (`schema.ts`)
   ```typescript
   import { defineTable } from "convex/server";
   import { v } from "convex/values";
   
   export const myFeatureTable = defineTable({
       userId: v.id("users"),
       status: v.string(),
       createdAt: v.number(),
   })
   .index("by_userId", ["userId"])
   .index("by_status", ["status"]);
   ```

3. **Create types** (`types/status.ts`)
   ```typescript
   import { v } from "convex/values";
   
   export const myFeatureStatus = v.union(
       v.literal("active"),
       v.literal("inactive")
   );
   
   export type MyFeatureStatus = typeof myFeatureStatus.type;
   ```

4. **Build business logic** (`cases/mutations/_createMyFeatureMutation.ts`)
   ```typescript
   export async function _createMyFeatureMutation(ctx: MutationCtx, args: {...}) {
       // Validation
       // Business logic
       // Database operations
   }
   ```

5. **Create public API** (`integrations/writes.ts`)
   ```typescript
   export const createMyFeature = mutation({
       args: {...},
       handler: async (ctx, args) => {
           const user = await getCurrentUserOrThrow(ctx);
           return await _createMyFeatureMutation(ctx, {...});
       },
   });
   ```

6. **Add queries** (`integrations/reads.ts`)
   ```typescript
   export const getMyFeatures = query({
       args: {...},
       handler: async (ctx, args) => {
           const user = await getCurrentUserOrThrow(ctx);
           return await _getMyFeaturesQuery(ctx, user._id);
       },
   });
   ```

7. **Test and iterate**

## Common Patterns

### Cross-Feature Dependencies

When one feature needs another feature's data:

```typescript
// ✅ Good: Import from cases (business logic)
import { _getBookingOrThrow } from "../../bookings/cases/_getBookingOrThrow";

// ❌ Avoid: Importing from integrations
// import { getBooking } from "../../bookings/integrations/reads";
```

### Authentication

Always verify user identity in public APIs:

```typescript
import { getCurrentUserOrThrow } from "../../model/users";

export const protectedMutation = mutation({
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        // Now you have verified user
    },
});
```

### Pagination

Use Convex's built-in pagination:

```typescript
import { paginationOptsValidator } from "convex/server";

export const getPaginated = query({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("table")
            .paginate(args.paginationOpts);
    },
});
```

## Summary

- **Keep business logic in `cases/`** - Reusable, testable, pure functions
- **Use `integrations/` for APIs** - Public-facing interfaces
- **Follow naming conventions** - `_` prefix for internal, clear names
- **Optimize queries** - Use indexes and `.first()` when possible
- **Combine related queries** - Reduce round trips
- **Type everything** - Use Convex validators
- **Reuse helpers** - DRY principle

This architecture ensures:
- ✅ Consistency across features
- ✅ Easy to understand and maintain
- ✅ Scalable and performant
- ✅ Type-safe and robust
