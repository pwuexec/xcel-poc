import { query } from "../../_generated/server";
import { _listAllUsersQuery } from "../cases/queries/_listAllUsersQuery";

/**
 * Public query to list all users
 * Requires admin role
 */
export const listAllUsers = query({
    handler: async (ctx) => {
        return await _listAllUsersQuery(ctx);
    }
});
