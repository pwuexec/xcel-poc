# Users Feature

Core user management functionality including authentication, role-based access control, and user queries.

## Architecture

This feature follows the standard architecture pattern:

```
users/
├── schema.ts                           # User table definition
├── types/
│   └── role.ts                         # Role type definition
├── cases/                              # Business logic layer (internal)
│   ├── _isRole.ts                      # Role checking helper
│   └── queries/
│       ├── _getCurrentUserQuery.ts     # Get current user and helpers
│       └── _getAllUsersQuery.ts        # Get all users (filtered)
└── integrations/                       # API layer (public)
    └── reads.ts                        # Public query APIs
```

## Schema

Users are stored with:
- `name`: User's display name (optional)
- `image`: Profile image URL (optional)
- `email`: Email address (optional)
- `emailVerificationTime`: Timestamp of email verification (optional)
- `phone`: Phone number (optional)
- `phoneVerificationTime`: Timestamp of phone verification (optional)
- `isAnonymous`: Whether user is anonymous (optional)
- `role`: User role - "user" | "tutor" | "admin" (optional)

Indexes:
- `email`: For querying by email
- `phone`: For querying by phone
- `role`: For querying by role

## Types

### Role
```typescript
type Role = "user" | "tutor" | "admin";
```

## Public APIs

### Reads (`integrations/reads.ts`)

- **getAllUsers**: Get all users filtered by current user role
  - Tutors see students ("user" role)
  - Students/admins see tutors ("tutor" role)
  - Returns: Array of users

- **getMe**: Get current authenticated user
  - Returns: Current user or null if not authenticated

## Internal Helpers

### Queries

- **getCurrentUserId**: Get current user ID from auth
  - Returns: User ID or null

- **getCurrentUserIdOrThrow**: Get current user ID or throw
  - Throws: AUTH1:Not authenticated if not logged in
  - Returns: User ID

- **getCurrentUser**: Get current user document
  - Returns: User document or null

- **getCurrentUserOrThrow**: Get current user or throw
  - Throws: AUTH1:Not authenticated if not logged in
  - Returns: User document

- **getUserById**: Get user by ID
  - Args: userId
  - Returns: User document or null

- **getUserByIdOrThrow**: Get user by ID or throw
  - Args: userId
  - Throws: AUTH2:User not found if user doesn't exist
  - Returns: User document

### Helpers

- **_isRole**: Check if user has specific role
  - Args: user, role
  - Returns: boolean

## Usage Example

```typescript
// In a React component
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

function UsersList() {
  // Get all users (filtered by role)
  const users = useQuery(api.users.integrations.reads.getAllUsers);

  // Get current user
  const currentUser = useQuery(api.users.integrations.reads.getMe);

  // Check if admin
  const isAdmin = currentUser?.role === "admin";
}
```

```typescript
// In a Convex mutation/query
import { getCurrentUserOrThrow } from "../../users/cases/queries/_getCurrentUserQuery";
import { _isRole } from "../../users/cases/_isRole";

export async function myMutation(ctx: MutationCtx) {
  const currentUser = await getCurrentUserOrThrow(ctx);
  
  if (_isRole(currentUser, "admin")) {
    // Admin-only logic
  }
}
```

## Security

- All authenticated operations use `getCurrentUserOrThrow` to ensure user is logged in
- Role checks use `_isRole` helper for consistency
- User queries are filtered by role to show relevant users only

## Error Codes

- **AUTH1**: Not authenticated - user must be logged in
- **AUTH2**: User not found - requested user doesn't exist
