# Admin Feature

Administrative functionality for managing users, roles, and platform settings.

## Architecture

This feature follows the standard architecture pattern:

```
admin/
├── cases/                              # Business logic layer (internal)
│   ├── mutations/
│   │   ├── _updateUserRoleMutation.ts  # Update user role
│   │   ├── _updateUserNameMutation.ts  # Update user name
│   │   └── _createUserMutation.ts      # Create new user
│   └── queries/
│       └── _listAllUsersQuery.ts       # List all users
└── integrations/                       # API layer (public)
    ├── reads.ts                        # Public query APIs
    └── writes.ts                       # Public mutation APIs
```

## Public APIs

### Reads (`integrations/reads.ts`)

- **listAllUsers**: List all users in the system
  - Requires: Admin role
  - Returns: Array of all users
  - Throws: "Unauthorized: Admin access required" if not admin

### Writes (`integrations/writes.ts`)

- **updateUserRole**: Update a user's role
  - Requires: Admin role
  - Args: userId, role ("user" | "tutor" | "admin")
  - Validation: Cannot change own role
  - Throws: "Unauthorized: Admin access required" if not admin
  - Throws: "You cannot change your own role" if trying to change own role

- **updateUserName**: Update a user's name
  - Requires: Admin role
  - Args: userId, name
  - Throws: "Unauthorized: Admin access required" if not admin

- **createUser**: Create a new user with password
  - Requires: Admin role
  - Args: name, email, role, password
  - Validation: Email must be unique
  - Returns: New user ID
  - Throws: "Unauthorized: Admin access required" if not admin
  - Throws: "A user with this email already exists" if email exists

## Internal Helpers

### Mutations

- **_updateUserRoleMutation**: Core logic for updating user roles
  - Validates admin access
  - Prevents self-role changes
  - Updates user role

- **_updateUserNameMutation**: Core logic for updating user names
  - Validates admin access
  - Updates user name

- **_createUserMutation**: Core logic for creating users
  - Validates admin access
  - Checks for email uniqueness
  - Creates password account
  - Returns user ID

### Queries

- **_listAllUsersQuery**: Core logic for listing all users
  - Validates admin access
  - Returns all users without filtering

## Usage Example

```typescript
// In a React component
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";

function AdminUsersPage() {
  // List all users
  const users = useQuery(api.admin.integrations.reads.listAllUsers);

  // Update role
  const updateRole = useMutation(api.admin.integrations.writes.updateUserRole);
  
  // Update name
  const updateName = useMutation(api.admin.integrations.writes.updateUserName);
  
  // Create user
  const createUser = useMutation(api.admin.integrations.writes.createUser);

  // Change user role
  await updateRole({ 
    userId: user._id, 
    role: "tutor" 
  });

  // Create new user
  await createUser({
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    password: "secure-password"
  });
}
```

## Security

- All operations require admin role
- Uses `getCurrentUserOrThrow` to ensure authentication
- Uses `_isRole` to verify admin access
- Prevents admins from changing their own role
- Validates email uniqueness on user creation

## Dependencies

- Uses `users` feature for authentication and role checking
- Imports from:
  - `users/cases/queries/_getCurrentUserQuery.ts`
  - `users/cases/_isRole.ts`
  - `users/types/role.ts`

## Error Messages

- "Unauthorized: Admin access required" - User is not an admin
- "You cannot change your own role" - Admin trying to change their own role
- "A user with this email already exists" - Email already in use

## Best Practices

- Always check admin role before any operation
- Never allow admins to modify their own role
- Validate email uniqueness before creating users
- Use strong passwords when creating users
- Log admin actions for audit purposes (future enhancement)
