"use client";

import { useEffect, useRef, useState } from "react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { generateWhiteboardToken } from "@/app/actions/whiteboardToken";

interface VideoCallProps {
    bookingId: string;
    userName: string;
    userId: string;
    onClose: () => void;
}

export default function VideoCall({
    bookingId,
    userName,
    userId,
    onClose,
}: VideoCallProps) {
    const callFrameRef = useRef<DailyCall | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [whiteboardToken, setWhiteboardToken] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const initializeCall = async () => {
            try {
                if (!containerRef.current) {
                    throw new Error("Container ref not ready");
                }

                // Generate whiteboard token
                const token = await generateWhiteboardToken(userId, bookingId, userName);
                if (!mounted) return;
                setWhiteboardToken(token);

                // Cleanup any existing instance first
                if (callFrameRef.current) {
                    callFrameRef.current.destroy();
                    callFrameRef.current = null;
                }

                // Fetch room URL from backend
                const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace("cloud", "site");
                if (!convexUrl) {
                    throw new Error("Convex URL not configured");
                }

                const response = await fetch(`${convexUrl}/daily-room`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bookingId, userId, userName }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to create room: ${response.status}`);
                }

                const { roomUrl, token: dailyToken } = await response.json();

                if (!mounted) return;

                // Create Daily call frame
                const callFrame = DailyIframe.createFrame(containerRef.current, {
                    iframeStyle: {
                        width: "100%",
                        height: "100%",
                        border: "0",
                    },
                    showLeaveButton: true,
                    showFullscreenButton: true,
                    customIntegrations: {
                        whiteboard: {
                            allow: "camera; microphone; fullscreen; clipboard-read; clipboard-write; display-capture",
                            controlledBy: "*",
                            iconURL: "https://excalidraw.com/apple-touch-icon.png",
                            label: "Whiteboard",
                            location: "main",
                            name: "Excalidraw",
                            shared: true,
                            src: `${process.env.NEXT_PUBLIC_APP_URL}/whiteboard?token=${token}`,
                        },
                    },
                });

                if (!mounted) {
                    callFrame.destroy();
                    return;
                }

                callFrameRef.current = callFrame;

                // Set up event listeners
                callFrame
                    .on("loaded", () => mounted && setLoading(false))
                    .on("joined-meeting", () => mounted && setLoading(false))
                    .on("left-meeting", onClose)
                    .on("camera-error", () => {
                        if (mounted) {
                            setError("Camera permission denied or not available");
                            setLoading(false);
                        }
                    })
                    .on("error", (event) => {
                        if (mounted) {
                            setError(event?.errorMsg || "An error occurred");
                            setLoading(false);
                        }
                    });

                // Join the room
                await callFrame.join({
                    url: roomUrl,
                    token: dailyToken,
                    userName: userName,
                });
            } catch (err: any) {
                if (mounted) {
                    setError(err?.message || "Failed to initialize video call");
                    setLoading(false);
                }
            }
        };

        initializeCall();

        return () => {
            mounted = false;
            if (callFrameRef.current) {
                callFrameRef.current.destroy();
                callFrameRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId, userId, userName]); // onClose is intentionally omitted

    const handleManualClose = () => {
        if (callFrameRef.current) {
            callFrameRef.current.destroy();
            callFrameRef.current = null;
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black">
            {/* Loading State */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
                    <div className="text-center">
                        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white border-r-transparent mb-4"></div>
                        <p className="text-white text-lg">Connecting to video call...</p>
                        <p className="text-zinc-400 text-sm mt-2">Room: {bookingId}</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 p-4 z-10">
                    <div className="bg-red-900/20 border border-red-600 rounded-lg p-8 max-w-md w-full">
                        <h3 className="text-xl font-bold text-red-500 mb-4">
                            Connection Failed
                        </h3>
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

            {/* Video Call Container - Full Screen */}
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
}