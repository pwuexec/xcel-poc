# WebSocket Setup for Whiteboard Collaboration

This project uses a custom WebSocket server to enable real-time collaboration on the whiteboard feature.

## Overview

The WebSocket server has replaced Liveblocks for real-time broadcasting of whiteboard updates between users. The actual whiteboard state is still persisted to Convex for reliability.

## Architecture

- **WebSocket Server**: `server/websocket-server.ts` - Handles real-time broadcasts
- **Client Hook**: `hooks/useWhiteboardWebSocket.ts` - React hook for WebSocket connection
- **Persistence**: Convex database stores whiteboard state every 2 seconds

## Running the Application

Start all services in development:

```bash
npm run dev
```

This runs three processes in parallel:
- `dev:backend` - Convex backend
- `dev:frontend` - Next.js frontend (port 3000)
- `dev:ws` - WebSocket server (port 8080)

## Configuration

### Environment Variables

The WebSocket server URL can be configured via environment variable:

```bash
# .env.local
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

Default: `ws://localhost:8080`

### WebSocket Port

The WebSocket server port can be customized:

```bash
WS_PORT=8080
```

## How It Works

### 1. Connection Flow

1. User opens whiteboard page
2. `WhiteboardClient` renders `CollaborativeApp`
3. `useWhiteboardWebSocket` hook connects to WebSocket server
4. Client joins room `whiteboard-{bookingId}`

### 2. Real-time Updates

- User draws on whiteboard
- Changes are throttled to every 100ms
- Updates are broadcast via WebSocket to other users in the same room
- Elements are reconciled client-side to prevent conflicts

### 3. Persistence

- Changes are saved to Convex every 2 seconds
- When joining, the latest state is loaded from Convex
- WebSocket only handles real-time broadcasts (not storage)

## WebSocket Server API

### Client → Server Messages

#### Join Room
```json
{
  "type": "join",
  "roomId": "whiteboard-abc123",
  "userId": "user_id",
  "userName": "John Doe"
}
```

#### Broadcast Update
```json
{
  "type": "broadcast",
  "data": {
    "type": "excalidraw-update",
    "elements": [...],
    "appState": {...}
  }
}
```

#### Leave Room
```json
{
  "type": "leave"
}
```

### Server → Client Messages

#### Joined Acknowledgment
```json
{
  "type": "joined",
  "roomId": "whiteboard-abc123",
  "participants": 2
}
```

#### User Joined
```json
{
  "type": "user-joined",
  "userId": "user_id",
  "userName": "Jane Doe",
  "participants": 3
}
```

#### User Left
```json
{
  "type": "user-left",
  "userId": "user_id",
  "userName": "Jane Doe",
  "participants": 2
}
```

#### Broadcast from Other User
```json
{
  "type": "broadcast",
  "data": {...},
  "userId": "other_user_id",
  "userName": "Other User"
}
```

## Features

- ✅ Real-time collaboration (100ms update throttle)
- ✅ Automatic reconnection on connection loss
- ✅ Participant count tracking
- ✅ Connection status indicator
- ✅ Room-based isolation (users only see updates in their booking)
- ✅ Heartbeat to keep connections alive
- ✅ Persistence to Convex database

## Production Deployment

For production, you'll need to:

1. **Deploy WebSocket server separately**:
   - Use a service like Railway, Render, or Fly.io
   - Ensure WebSocket support (not all platforms support it)
   - Use WSS (WebSocket Secure) instead of WS

2. **Update environment variable**:
   ```bash
   NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com
   ```

3. **Consider scaling**:
   - For multiple WebSocket server instances, you'll need Redis for pub/sub
   - Or use a managed service like Ably, Pusher, or Socket.io

## Troubleshooting

### Connection Issues

Check that:
- WebSocket server is running (`npm run dev:ws`)
- Port 8080 is not blocked by firewall
- Environment variable `NEXT_PUBLIC_WS_URL` is correct

### Performance Issues

- Reduce broadcast throttle (currently 100ms)
- Increase Convex save interval (currently 2s)
- Check network latency

### Users Not Seeing Updates

- Verify users are in the same room (same `bookingId`)
- Check browser console for WebSocket errors
- Ensure WebSocket server is running
