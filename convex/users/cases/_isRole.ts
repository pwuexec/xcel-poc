import { Role } from "../types/role";
import { getUserById } from "./queries/_getCurrentUserQuery";

/**
 * Internal helper to check if user has a specific role
 * Used throughout the users feature
 */
export function _isRole(
    user: Awaited<ReturnType<typeof getUserById>>,
    role: Role
) {
    if (!user?.role) {
        return false;
    }

    return role === user.role;
}
