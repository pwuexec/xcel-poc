# Messages Feature

Messages allow users to communicate about their bookings within the platform.

## Architecture

This feature follows the standard architecture pattern:

```
messages/
├── schema.ts                           # Message table definition
├── cases/                              # Business logic layer (internal)
│   ├── mutations/                      # Write operations
│   │   ├── _sendMessageMutation.ts     # Send a message
│   │   └── _markMessagesAsReadMutation.ts  # Mark messages as read
│   └── queries/                        # Read operations
│       ├── _getBookingMessagesQuery.ts # Get messages for a booking
│       └── _getUnreadMessageCountQuery.ts  # Get unread count
└── integrations/                       # API layer (public)
    ├── reads.ts                        # Public query APIs
    └── writes.ts                       # Public mutation APIs
```

## Schema

Messages are stored with:
- `bookingId`: Link to the booking
- `userId`: User who sent the message
- `message`: The message content (max 1000 characters)
- `timestamp`: When the message was sent
- `readBy`: Array of user IDs who have read the message

Indexes:
- `bookingId`: For querying messages by booking
- `timestamp`: For ordering messages

## Public APIs

### Reads (`integrations/reads.ts`)

- **getBookingMessages**: Get all messages for a booking with user info
  - Requires: `bookingId`
  - Returns: Messages with userName and userImage
  - Validates: User has access to the booking

- **getUnreadCount**: Get count of unread messages for a booking
  - Requires: `bookingId`
  - Returns: Number of unread messages

### Writes (`integrations/writes.ts`)

- **sendMessage**: Send a message to a booking
  - Requires: `bookingId`, `message`
  - Validates: Message not empty, max 1000 chars, user has booking access
  - Effects: Creates message, marks sender as having read it

- **markMessagesAsRead**: Mark all messages in a booking as read
  - Requires: `bookingId`
  - Effects: Adds current user to readBy array

## Internal Helpers

### Mutations

- **_sendMessageMutation**: Core logic for sending messages
  - Validates booking access
  - Trims and validates message content
  - Automatically marks sender as having read their own message

- **_markMessagesAsReadMutation**: Core logic for marking messages as read
  - Validates booking access
  - Updates readBy array for unread messages

### Queries

- **_getBookingMessagesQuery**: Core logic for fetching messages
  - Validates booking access
  - Enriches messages with user information
  - Returns messages sorted by timestamp

- **_getUnreadMessageCountQuery**: Core logic for counting unread messages
  - Filters messages by readBy array
  - Returns count only (no message content)

## Usage Example

```typescript
// In a React component
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";

function BookingChat({ bookingId }: { bookingId: Id<"bookings"> }) {
  // Get messages
  const messages = useQuery(
    api.messages.integrations.reads.getBookingMessages,
    { bookingId }
  );

  // Get unread count
  const unreadCount = useQuery(
    api.messages.integrations.reads.getUnreadCount,
    { bookingId }
  );

  // Send message
  const sendMessage = useMutation(
    api.messages.integrations.writes.sendMessage
  );

  // Mark as read
  const markAsRead = useMutation(
    api.messages.integrations.writes.markMessagesAsRead
  );

  // Send a message
  await sendMessage({ bookingId, message: "Hello!" });

  // Mark messages as read
  await markAsRead({ bookingId });
}
```

## Security

- All operations verify the current user has access to the booking
- Uses `_ensureBookingAccess` from bookings feature
- Message content is trimmed and validated
- Maximum message length: 1000 characters

## Performance

- Messages are indexed by `bookingId` for efficient queries
- Unread count query filters in-memory (no separate index needed)
- User enrichment is done after fetch (could be optimized with joins if needed)
