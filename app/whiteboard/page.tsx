import { Suspense } from "react";
import { WhiteboardClient } from "./WhiteboardClient";
import { decryptWhiteboardToken } from "@/lib/whiteboardToken";

async function WhiteboardContent({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const { token } = await searchParams;

    if (!token) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
                    <p className="text-gray-400">Please access the whiteboard through the video call.</p>
                </div>
            </div>
        );
    }

    try {
        // Decrypt and validate the token on the server
        const payload = decryptWhiteboardToken(token);

        return (
            <WhiteboardClient
                bookingId={payload.bookingId}
                userId={payload.userId}
                userName={payload.userName}
            />
        );
    } catch (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Invalid or Expired Token</h1>
                    <p className="text-gray-400">
                        {error instanceof Error ? error.message : "Please request a new whiteboard link through the video call."}
                    </p>
                </div>
            </div>
        );
    }
}

export default function Room({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading…</div>}>
            <WhiteboardContent searchParams={searchParams} />
        </Suspense>
    );
}
