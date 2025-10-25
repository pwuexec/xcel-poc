"use client";

import { useEffect, useRef, useState } from 'react';

interface UseWhiteboardWebSocketOptions {
    roomId: string;
    userId: string;
    userName: string;
    onMessage: (data: any) => void;
    onUserJoined?: (userId: string, userName: string, participants: number) => void;
    onUserLeft?: (userId: string, userName: string, participants: number) => void;
}

export function useWhiteboardWebSocket({
    roomId,
    userId,
    userName,
    onMessage,
    onUserJoined,
    onUserLeft,
}: UseWhiteboardWebSocketOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const [isConnected, setIsConnected] = useState(false);
    const [participants, setParticipants] = useState(1);

    // Use refs to store callbacks to avoid reconnection loops
    const onMessageRef = useRef(onMessage);
    const onUserJoinedRef = useRef(onUserJoined);
    const onUserLeftRef = useRef(onUserLeft);

    // Update refs when callbacks change
    useEffect(() => {
        onMessageRef.current = onMessage;
        onUserJoinedRef.current = onUserJoined;
        onUserLeftRef.current = onUserLeft;
    }, [onMessage, onUserJoined, onUserLeft]);

    useEffect(() => {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
        const ws = new WebSocket(wsUrl);

        function setupWebSocket(websocket: WebSocket) {
            websocket.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);

                // Join the room
                websocket.send(JSON.stringify({
                    type: 'join',
                    roomId,
                    userId,
                    userName,
                }));
            };

            websocket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    switch (message.type) {
                        case 'joined':
                            setParticipants(message.participants);
                            break;

                        case 'broadcast':
                            onMessageRef.current(message.data);
                            break;

                        case 'user-joined':
                            setParticipants(message.participants);
                            onUserJoinedRef.current?.(message.userId, message.userName, message.participants);
                            break;

                        case 'user-left':
                            setParticipants(message.participants);
                            onUserLeftRef.current?.(message.userId, message.userName, message.participants);
                            break;

                        default:
                            console.log('Unknown message type:', message.type);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            websocket.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);

                // Attempt to reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    const newWs = new WebSocket(wsUrl);
                    setupWebSocket(newWs);
                    wsRef.current = newWs;
                }, 3000);
            };

            websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        }

        setupWebSocket(ws);
        wsRef.current = ws;

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [roomId, userId, userName]);

    function broadcast(data: any) {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'broadcast',
                data,
            }));
        }
    }

    return {
        broadcast,
        isConnected,
        participants,
    };
}
