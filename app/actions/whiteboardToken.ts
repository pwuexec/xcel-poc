"use server";

import { encryptWhiteboardToken } from "@/lib/whiteboardToken";

export async function generateWhiteboardToken(
    userId: string,
    bookingId: string,
    userName: string
): Promise<string> {
    return encryptWhiteboardToken({
        userId,
        bookingId,
        userName,
    });
}
