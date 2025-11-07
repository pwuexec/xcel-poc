# Recurring Rules Feature

Automatic recurring booking creation based on weekly schedules.

## Architecture

This feature follows the standard architecture pattern:

```
recurringRules/
├── schema.ts                                    # RecurringRules table definition
├── README.md                                     # Feature documentation
├── types/
│   └── recurringRule.ts                         # DayOfWeek and RecurringRuleStatus types
├── cases/                                        # Business logic (internal)
│   ├── _ensureRecurringRuleAccess.ts            # Access control helper
│   ├── _bookingHelpers.ts                       # Booking calculation helpers
│   ├── mutations/
│   │   ├── _createRecurringRuleMutation.ts      # Create recurring rule
│   │   ├── _updateRecurringRuleStatusMutation.ts # Update status (pause/resume/cancel)
│   │   └── _deleteRecurringRuleMutation.ts      # Delete recurring rule
│   └── queries/
│       └── _getUserRecurringRulesQuery.ts       # Get user's rules
└── integrations/                                # API layer (public)
    ├── reads.ts                                 # getMyRecurringRules
    ├── writes.ts                                # create, pause, resume, cancel, delete
    └── crons.ts                                 # processRecurringRules (internal)
```

## Schema

Recurring rules are stored with:
- `fromUserId`: User who created the rule (student)
- `toUserId`: Target user for bookings (tutor)
- `dayOfWeek`: Day of week for recurring booking
- `hourUTC`: Hour in UTC (0-23)
- `minuteUTC`: Minute (0-59)
- `status`: "active" | "paused" | "canceled"
- `lastBookingCreatedAt`: Timestamp of last booking creation (optional)
- `createdAt`: When rule was created

Indexes:
- `by_fromUserId`: For querying rules by creator
- `by_toUserId`: For querying rules by target user
- `by_fromUserId_toUserId`: For checking duplicates
- `by_status`: For cron job to find active rules

## Types

### DayOfWeek
```typescript
type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
```

### RecurringRuleStatus
```typescript
type RecurringRuleStatus = "active" | "paused" | "canceled";
```

## Public APIs

### Reads (`integrations/reads.ts`)

- **getMyRecurringRules**: Get all recurring rules for current user
  - Returns: Array of rules with user info
  - Filters by role: students see rules they created, tutors see rules targeting them

### Writes (`integrations/writes.ts`)

- **createRecurringRule**: Create a new recurring rule
  - Args: toUserId, dayOfWeek, hourUTC, minuteUTC
  - Validation: Tutor-student relationship, time values, no duplicates
  - Returns: Rule ID
  - Throws: Various validation errors

- **pauseRecurringRule**: Pause a recurring rule
  - Args: ruleId
  - Sets status to "paused"
  - Throws: If not authorized

- **resumeRecurringRule**: Resume a paused recurring rule
  - Args: ruleId
  - Sets status to "active"
  - Throws: If not authorized

- **cancelRecurringRule**: Cancel a recurring rule (soft delete)
  - Args: ruleId
  - Sets status to "canceled"
  - Throws: If not authorized

- **deleteRecurringRule**: Delete a recurring rule (hard delete)
  - Args: ruleId
  - Permanently removes rule
  - Throws: If not authorized

### Crons (`integrations/crons.ts`)

- **processRecurringRules**: Internal cron job to create bookings
  - Runs weekly (configured in crons.ts)
  - Processes all active rules
  - Creates bookings for upcoming week
  - Updates lastBookingCreatedAt
  - Returns: Summary of processed, skipped, and error counts

## Internal Helpers

### Access Control

- **_ensureRecurringRuleAccess**: Verify user has access to a rule
  - Checks if user is fromUserId or toUserId
  - Throws if unauthorized

### Booking Helpers

- **_getNextBookingTimestamp**: Calculate next booking timestamp
  - Args: dayOfWeek, hourUTC, minuteUTC, fromDate
  - Returns: Timestamp for next occurrence
  - Used by cron jobs

- **_shouldCreateBookingThisWeek**: Check if booking should be created
  - Args: lastBookingCreatedAt, now
  - Returns: Boolean
  - Prevents duplicate bookings in same week

### Mutations

- **_createRecurringRuleMutation**: Core logic for creating rules
  - Validates tutor-student relationship
  - Validates time values (0-23 hours, 0-59 minutes)
  - Checks for duplicate rules
  - Creates rule with "active" status

- **_updateRecurringRuleStatusMutation**: Core logic for status updates
  - Validates access
  - Updates status field

- **_deleteRecurringRuleMutation**: Core logic for deletion
  - Validates access
  - Hard deletes rule

### Queries

- **_getUserRecurringRulesQuery**: Core logic for getting user's rules
  - Filters by user role (fromUserId for students, toUserId for tutors)
  - Enriches with user information
  - Returns array of rules with participants

## Usage Example

```typescript
// In a React component
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";

function RecurringRulesPage() {
  // Get my recurring rules
  const rules = useQuery(api.recurringRules.integrations.reads.getMyRecurringRules);

  // Create a recurring rule
  const createRule = useMutation(api.recurringRules.integrations.writes.createRecurringRule);
  
  // Pause a rule
  const pauseRule = useMutation(api.recurringRules.integrations.writes.pauseRecurringRule);
  
  // Create rule for every Monday at 10:00 UTC
  await createRule({
    toUserId: tutorId,
    dayOfWeek: "monday",
    hourUTC: 10,
    minuteUTC: 0,
  });
  
  // Pause a rule
  await pauseRule({ ruleId });
}
```

## Cron Job Configuration

In `convex/crons.ts`:

```typescript
crons.weekly(
    "process recurring booking rules",
    {
        dayOfWeek: "monday",
        hourUTC: 0,
        minuteUTC: 0,
    },
    internal.recurringRules.integrations.crons.processRecurringRules
);
```

## Security

- All operations verify user authentication
- Access control ensures users can only modify their own rules
- Validates tutor-student relationship on creation
- Prevents duplicate active rules with same schedule

## Validation

- **Time values**: 0-23 for hours, 0-59 for minutes
- **Tutor-student**: Uses `_validateTutorStudentRelationship`
- **Duplicates**: Checks for existing active rules with same schedule
- **Access**: Verifies user is participant in rule

## Dependencies

- Uses `users` feature for authentication
- Uses `bookings` feature for validation and booking creation
- Imports from:
  - `users/cases/queries/_getCurrentUserQuery.ts`
  - `users/cases/_isRole.ts`
  - `bookings/cases/_validateTutorStudentRelationship.ts`
  - `bookings/cases/mutations/_createBookingMutation.ts`

## Error Messages

- "Recurring rule not found" - Rule doesn't exist
- "Not authorized to access this recurring rule" - User not participant
- "Hour must be between 0 and 23" - Invalid hour
- "Minute must be between 0 and 59" - Invalid minute
- "A recurring rule with the same schedule already exists" - Duplicate rule
- Plus tutor-student validation errors

## Best Practices

- Use soft delete (cancel) instead of hard delete when possible
- Schedule cron for low-traffic times (e.g., midnight UTC)
- Monitor cron job logs for errors
- Consider time zones when setting hourUTC/minuteUTC
- Test edge cases: week boundaries, time changes, etc.
