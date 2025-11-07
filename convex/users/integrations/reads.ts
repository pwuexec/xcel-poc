import { query } from "../../_generated/server";
import { getCurrentUser } from "../cases/queries/_getCurrentUserQuery";
import { _getAllUsersQuery } from "../cases/queries/_getAllUsersQuery";

/**
 * Public query to get all users (filtered by current user role)
 * Tutors see students, students/admins see tutors
 */
export const getAllUsers = query({
    handler: async (ctx) => {
        return await _getAllUsersQuery(ctx);
    }
});

/**
 * Public query to get current user
 */
export const getMe = query({
    handler: async (ctx) => {
        return await getCurrentUser(ctx);
    }
});
