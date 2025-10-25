"use client";

import { useEffect, useRef, useState } from "react";

interface VideoCallProps {
    bookingId: string;
    userName: string;
    userId: string;
    onClose: () => void;
}

export default function VideoCall({ bookingId, userName, userId, onClose }: VideoCallProps) {
    const meetingContainerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const zpRef = useRef<any>(null);
    const initializingRef = useRef(false);

    useEffect(() => {
        // Prevent double initialization (React strict mode)
        if (initializingRef.current) {
            return;
        }

        let cancelled = false;
        initializingRef.current = true;

        const myMeeting = async (element: HTMLDivElement) => {
            try {
                console.log("[VideoCall] Starting initialization...");

                // 1. Load SDKs
                const [
                    { ZegoUIKitPrebuilt },
                    { ZegoSuperBoardManager }
                ] = await Promise.all([
                    import("@zegocloud/zego-uikit-prebuilt"),
                    import("zego-superboard-web")
                ]);

                if (cancelled) return;

                console.log("[VideoCall] SDKs loaded");

                // 2. Fetch token from backend
                const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace("cloud", "site");
                if (!convexUrl) {
                    throw new Error("Convex URL not configured");
                }

                const response = await fetch(`${convexUrl}/zego-token`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, roomId: bookingId }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch token: ${response.status}`);
                }

                const { token, appID } = await response.json();

                if (cancelled) return;

                console.log("[VideoCall] Token received, appID:", appID);

                // 3. Generate Kit Token
                const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
                    Number(appID),
                    token,
                    bookingId,
                    userId,
                    userName
                );

                // 4. Create ZegoUIKit instance (following example pattern)
                const zp = ZegoUIKitPrebuilt.create(kitToken);
                zpRef.current = zp;

                // Set to window for debugging (like in example)
                // @ts-ignore
                window.zp = zp;

                console.log("[VideoCall] ZegoUIKitPrebuilt version:", ZegoUIKitPrebuilt.getVersion());

                // 5. Add plugins (following example pattern)
                zp.addPlugins({ ZegoSuperBoardManager });

                // 6. Join room with configuration (following example structure)
                zp.joinRoom({
                    container: element,

                    // Console level - only errors (like in example)
                    console: ZegoUIKitPrebuilt.ConsoleError,

                    // Scenario
                    scenario: {
                        mode: ZegoUIKitPrebuilt.GroupCall,
                    },

                    // Prejoin view
                    showPreJoinView: false,

                    // Audio/Video settings
                    turnOnMicrophoneWhenJoining: true,
                    turnOnCameraWhenJoining: true,
                    useFrontFacingCamera: true,

                    // UI Controls
                    showMyCameraToggleButton: true,
                    showMyMicrophoneToggleButton: true,
                    showAudioVideoSettingsButton: true,
                    showScreenSharingButton: true,
                    showTextChat: true,
                    showUserList: true,
                    showLayoutButton: true,
                    showPinButton: true,
                    showRemoveUserButton: false,

                    // Layout
                    layout: "Auto",
                    showNonVideoUser: true,
                    showOnlyAudioUser: true,

                    // Room features
                    showRoomTimer: true,

                    // Notifications
                    lowerLeftNotification: {
                        showUserJoinAndLeave: true,
                        showTextChat: true,
                    },

                    // Whiteboard configuration (like in example)
                    whiteboardConfig: {
                        showAddImageButton: true,
                        showCreateAndCloseButton: true,
                    },

                    // Leave room handling
                    showLeavingView: false,
                    showLeaveRoomConfirmDialog: true,

                    // Event callbacks (following example pattern)
                    onJoinRoom: async () => {
                        console.warn("[VideoCall] onJoinRoom");
                        setLoading(false);
                    },

                    onLeaveRoom: () => {
                        console.warn("[VideoCall] onLeaveRoom");
                        handleCleanup();
                        onClose();
                    },

                    onUserJoin: async (users) => {
                        console.warn("[VideoCall] onUserJoin", users);
                    },

                    onUserLeave: (users) => {
                        console.warn("[VideoCall] onUserLeave", users);
                    },

                    onInRoomMessageReceived: (messageInfo) => {
                        console.warn("[VideoCall] onInRoomMessageReceived", messageInfo);
                    },

                    onWhiteboardUpdated: (state, whiteboardId) => {
                        console.warn("[VideoCall] onWhiteboardUpdated", state, whiteboardId);
                    },

                    onLocalStreamUpdated: (state, streamID, stream) => {
                        console.warn("[VideoCall] onLocalStreamUpdated", state, streamID, stream);
                    },

                    onScreenSharingStreamUpdated: (state, streamID, stream) => {
                        console.warn("[VideoCall] onScreenSharingStreamUpdated", state, streamID, stream);
                    },

                    onCameraStateUpdated: (state) => {
                        console.warn("[VideoCall] onCameraStateUpdated", state);
                    },

                    onMicrophoneStateUpdated: (state) => {
                        console.warn("[VideoCall] onMicrophoneStateUpdated", state);
                    },
                });

                console.log("✅ Video call initialized successfully");

            } catch (err: any) {
                console.error("❌ Video call initialization error:", err);
                if (!cancelled) {
                    setError(err?.message || "Failed to initialize video call");
                    setLoading(false);
                }
            }
        };

        const handleCleanup = () => {
            if (zpRef.current) {
                try {
                    zpRef.current.destroy();
                    zpRef.current = null;
                } catch (err) {
                    console.error("Cleanup error:", err);
                }
            }
            initializingRef.current = false;
        };

        // Initialize when container is ready
        if (meetingContainerRef.current) {
            myMeeting(meetingContainerRef.current);
        }

        return () => {
            cancelled = true;
            handleCleanup();
        };
    }, [bookingId, userId, userName, onClose]);

    const handleManualClose = () => {
        if (zpRef.current) {
            try {
                zpRef.current.destroy();
            } catch (err) {
                console.error("Error closing call:", err);
            }
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black">
            {/* Loading State */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <div className="text-center">
                        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white border-r-transparent mb-4"></div>
                        <p className="text-white text-lg">Connecting to video call...</p>
                        <p className="text-zinc-400 text-sm mt-2">Room: {bookingId}</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 p-4">
                    <div className="bg-red-900/20 border border-red-600 rounded-lg p-8 max-w-md w-full">
                        <h3 className="text-xl font-bold text-red-500 mb-4">Connection Failed</h3>
                        <p className="text-white mb-6">{error}</p>
                        <button
                            onClick={handleManualClose}
                            className="w-full px-4 py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 text-white transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Meeting Container (following example pattern) */}
            <div
                ref={meetingContainerRef}
                className="w-full h-full"
            />

            {/* Manual Close Button (Emergency Exit) */}
            {!loading && !error && (
                <button
                    onClick={handleManualClose}
                    className="absolute top-4 right-4 z-50 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
                    title="Emergency exit"
                >
                    ✕ Close
                </button>
            )}
        </div>
    );
}
