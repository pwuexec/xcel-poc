import { QueryCtx, MutationCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { getUserByIdOrThrow, isRole } from "../../model/users";

export async function _validateTutorStudentRelationship(
    ctx: QueryCtx | MutationCtx,
    fromUserId: Id<"users">,
    toUserId: Id<"users">
) {
    const fromUser = await getUserByIdOrThrow(ctx, fromUserId);
    const toUser = await getUserByIdOrThrow(ctx, toUserId);

    const fromUserIsTutor = isRole(fromUser, "tutor");
    const toUserIsTutor = isRole(toUser, "tutor");

    if (fromUserIsTutor && toUserIsTutor) {
        throw new Error("Tutors cannot book sessions with other tutors");
    }

    if (!fromUserIsTutor && !toUserIsTutor) {
        throw new Error("Students cannot book sessions with other students");
    }

    return { fromUser, toUser };
}
