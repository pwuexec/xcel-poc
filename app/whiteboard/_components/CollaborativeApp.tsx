"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import { useWhiteboardWebSocket } from "@/hooks/useWhiteboardWebSocket";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const Excalidraw = dynamic(
    async () => {
        const mod = await import("@excalidraw/excalidraw");
        return mod.Excalidraw;
    },
    {
        ssr: false,
        loading: () => <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading Excalidraw...</div>,
    }
);

type ExcalidrawElement = {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
    strokeColor: string;
    backgroundColor: string;
    fillStyle: string;
    strokeWidth: number;
    strokeStyle: string;
    roughness: number;
    opacity: number;
    [key: string]: unknown;
};

type BroadcastEvent = {
    type: string;
    elements: ExcalidrawElement[];
    appState: {
        viewBackgroundColor: string;
    };
};

interface CollaborativeAppProps {
    bookingId: string;
    userId: string;
    userName: string;
}

export function CollaborativeApp({ bookingId, userId, userName }: CollaborativeAppProps) {
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const isReceivingUpdate = useRef(false);
    const lastBroadcastTime = useRef(0);
    const hasLoadedFromStorage = useRef(false);
    const lastSaveTime = useRef(0);

    // Read persisted elements and appState from Convex (using token-based query)
    const whiteboardData = useQuery(api.schemas.whiteboards.getWhiteboardStateByToken, {
        bookingId: bookingId as Id<"bookings">,
        userId: userId as Id<"users">,
    });

    // Mutation to update Convex storage (using token-based mutation)
    const updateConvexStorage = useMutation(api.schemas.whiteboards.updateWhiteboardStateByToken);

    // WebSocket connection for real-time collaboration
    const { broadcast, isConnected, participants } = useWhiteboardWebSocket({
        roomId: `whiteboard-${bookingId}`,
        userId,
        userName,
        onMessage: (data) => {
            if (!data || typeof data !== "object") return;

            const broadcastEvent = data as BroadcastEvent;
            if (broadcastEvent.type === "excalidraw-update" && excalidrawAPI) {
                isReceivingUpdate.current = true;

                // Update the scene with data from other users
                const currentElements = excalidrawAPI.getSceneElements();
                const reconciled = reconcileElements(currentElements, broadcastEvent.elements);

                excalidrawAPI.updateScene({
                    elements: reconciled,
                    appState: broadcastEvent.appState,
                    commitToHistory: false,
                });

                setTimeout(() => {
                    isReceivingUpdate.current = false;
                }, 50);
            }
        },
        onUserJoined: (userId, userName, participantCount) => {
            console.log(`${userName} joined the whiteboard (${participantCount} participants)`);
        },
        onUserLeft: (userId, userName, participantCount) => {
            console.log(`${userName} left the whiteboard (${participantCount} participants)`);
        },
    });

    // Load persisted state when Excalidraw API is ready
    useEffect(() => {
        if (excalidrawAPI && whiteboardData && !hasLoadedFromStorage.current) {
            hasLoadedFromStorage.current = true;

            if (whiteboardData.elements.length > 0) {
                excalidrawAPI.updateScene({
                    elements: whiteboardData.elements,
                    appState: whiteboardData.appState,
                    commitToHistory: false,
                });
            }
        }
    }, [excalidrawAPI, whiteboardData]);

    // Apply dark mode to Excalidraw when API is ready
    useEffect(() => {
        if (excalidrawAPI) {
            excalidrawAPI.updateScene({
                appState: {
                    theme: isDarkMode ? 'dark' : 'light',
                },
            });
        }
    }, [excalidrawAPI, isDarkMode]);

    // Reconcile local and remote elements
    const reconcileElements = (localElements: ExcalidrawElement[], remoteElements: ExcalidrawElement[]) => {
        const elementMap = new Map<string, ExcalidrawElement>();

        remoteElements.forEach((element) => {
            elementMap.set(element.id, element);
        });

        localElements.forEach((element) => {
            if (!elementMap.has(element.id)) {
                elementMap.set(element.id, element);
            }
        });

        return Array.from(elementMap.values());
    };

    const onChange = (elements: readonly ExcalidrawElement[], appState: { viewBackgroundColor: string }) => {
        if (isReceivingUpdate.current) return;

        // Throttle broadcasts and storage updates
        const now = Date.now();
        if (now - lastBroadcastTime.current < 100) return;
        lastBroadcastTime.current = now;

        const elementsArray = JSON.parse(JSON.stringify(Array.from(elements)));
        const appStateObj = {
            viewBackgroundColor: appState.viewBackgroundColor,
        };

        // Persist to Convex (throttled to every 2 seconds)
        if (now - lastSaveTime.current > 2000) {
            lastSaveTime.current = now;
            updateConvexStorage({
                bookingId: bookingId as Id<"bookings">,
                userId: userId as Id<"users">,
                elements: JSON.stringify(elementsArray),
                appState: JSON.stringify(appStateObj),
            });
        }

        // Also broadcast for real-time updates
        broadcast({
            type: "excalidraw-update",
            elements: elementsArray,
            appState: appStateObj,
        });
    };

    return (
        <div className={`h-screen w-full flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className={`p-3 border-b flex items-center justify-between ${isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-gray-100 border-gray-300 text-gray-900'
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-md text-sm font-medium ${isDarkMode
                        ? 'bg-blue-900/40 text-blue-300 border border-blue-700'
                        : 'bg-blue-100 text-blue-700 border border-blue-300'
                        }`}>
                        {bookingId}
                    </div>
                    <div className={`px-2 py-1 rounded-md text-xs flex items-center gap-2 ${isConnected
                            ? isDarkMode
                                ? 'bg-green-900/40 text-green-300 border border-green-700'
                                : 'bg-green-100 text-green-700 border border-green-300'
                            : isDarkMode
                                ? 'bg-red-900/40 text-red-300 border border-red-700'
                                : 'bg-red-100 text-red-700 border border-red-300'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {isConnected ? `${participants} online` : 'Reconnecting...'}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        {isDarkMode ? '🌙 Dark' : '☀️ Light'}
                    </button>
                </div>
            </div>
            <div
                className="flex-1 relative"
                style={{ height: "calc(100vh - 56px)" }}
            >
                <Excalidraw
                    excalidrawAPI={(api) => setExcalidrawAPI(api)}
                    onChange={onChange}
                    theme={isDarkMode ? 'dark' : 'light'}
                    initialData={{
                        appState: {
                            theme: isDarkMode ? 'dark' : 'light',
                        },
                    }}
                />

                {/* Cursors removed */}
            </div>
        </div>
    );
}