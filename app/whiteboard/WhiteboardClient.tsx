"use client";

import { RoomProvider } from "../../liveblocks.config";
import { ClientSideSuspense } from "@liveblocks/react";
import { CollaborativeApp } from "./_components/CollaborativeApp";
import "@excalidraw/excalidraw/index.css";

interface WhiteboardClientProps {
    bookingId: string;
    userId: string;
    userName: string;
}

export function WhiteboardClient({ bookingId, userId, userName }: WhiteboardClientProps) {
    return (
        <RoomProvider
            id={`whiteboard-${bookingId}`}
            initialPresence={{}}
        >
            <ClientSideSuspense fallback={<div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading whiteboard…</div>}>
                <CollaborativeApp bookingId={bookingId} userId={userId} userName={userName} />
            </ClientSideSuspense>
        </RoomProvider>
    );
}
