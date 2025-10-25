import { WebSocketServer, WebSocket } from 'ws';

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 8080;

interface Client {
    ws: WebSocket;
    roomId: string;
    userId: string;
    userName: string;
}

const clients = new Map<WebSocket, Client>();
const rooms = new Map<string, Set<WebSocket>>();

const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 WebSocket server running on ws://localhost:${PORT}`);

wss.on('connection', (ws: WebSocket) => {
    console.log('New connection established');

    ws.on('message', (data: Buffer) => {
        try {
            const message = JSON.parse(data.toString());

            switch (message.type) {
                case 'join':
                    handleJoin(ws, message);
                    break;

                case 'broadcast':
                    handleBroadcast(ws, message);
                    break;

                case 'leave':
                    handleLeave(ws);
                    break;

                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        handleLeave(ws);
        console.log('Connection closed');
    });

    ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
        handleLeave(ws);
    });
});

function handleJoin(ws: WebSocket, message: any) {
    const { roomId, userId, userName } = message;

    // Store client info
    clients.set(ws, { ws, roomId, userId, userName });

    // Add to room
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }
    rooms.get(roomId)!.add(ws);

    console.log(`User ${userName} (${userId}) joined room ${roomId}`);
    console.log(`Room ${roomId} now has ${rooms.get(roomId)!.size} participants`);

    // Send acknowledgment
    ws.send(JSON.stringify({
        type: 'joined',
        roomId,
        participants: rooms.get(roomId)!.size,
    }));

    // Notify others in the room
    broadcastToRoom(roomId, ws, {
        type: 'user-joined',
        userId,
        userName,
        participants: rooms.get(roomId)!.size,
    });
}

function handleBroadcast(ws: WebSocket, message: any) {
    const client = clients.get(ws);
    if (!client) {
        console.error('Broadcast from unknown client');
        return;
    }

    // Broadcast to all other clients in the same room
    broadcastToRoom(client.roomId, ws, {
        type: 'broadcast',
        data: message.data,
        userId: client.userId,
        userName: client.userName,
    });
}

function handleLeave(ws: WebSocket) {
    const client = clients.get(ws);
    if (!client) return;

    const { roomId, userId, userName } = client;

    // Remove from room
    const room = rooms.get(roomId);
    if (room) {
        room.delete(ws);

        // Notify others
        broadcastToRoom(roomId, ws, {
            type: 'user-left',
            userId,
            userName,
            participants: room.size,
        });

        // Clean up empty rooms
        if (room.size === 0) {
            rooms.delete(roomId);
            console.log(`Room ${roomId} deleted (empty)`);
        } else {
            console.log(`User ${userName} left room ${roomId}. ${room.size} participants remaining`);
        }
    }

    // Remove client
    clients.delete(ws);
}

function broadcastToRoom(roomId: string, sender: WebSocket, message: any) {
    const room = rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);

    room.forEach((client) => {
        // Don't send to the sender
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
}

// Heartbeat to keep connections alive
setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        }
    });
}, 30000); // Every 30 seconds
