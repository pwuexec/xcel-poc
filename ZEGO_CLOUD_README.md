# Zego Cloud Video Calling Integration

This document describes the Zego Cloud video calling integration for the bookings feature.

## Overview

Zego Cloud has been integrated to enable one-on-one video calling between tutors and students for confirmed bookings. The integration includes:

- **Video Call Component**: A full-screen video calling interface
- **Secure Token Generation**: Backend token generation via Convex HTTP endpoint
- **Booking Integration**: Video call button appears on confirmed bookings
- **Call Tracking**: Optional fields in the schema to track call duration and timestamps

## Setup Instructions

### 1. Get Zego Cloud Credentials

1. Sign up at [https://console.zegocloud.com](https://console.zegocloud.com)
2. Create a new project
3. Get your credentials:
   - **App ID**: Your application identifier
   - **App Sign**: Your application signature (for token generation)
   - **Server Secret**: Your server secret key

### 2. Configure Environment Variables in Convex Dashboard

The Zego Cloud credentials are configured in the Convex Dashboard (not in local `.env` files):

1. Go to your Convex Dashboard: [https://dashboard.convex.dev](https://dashboard.convex.dev)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add the following environment variables:
   - `ZEGO_APP_ID` = Your Zego App ID
   - `ZEGO_APP_SIGN` = Your Zego App Sign
   - `ZEGO_SERVER_SECRET` = Your Zego Server Secret

**Note**: Token validity is set to 1 hour by default.

### 3. Deploy or Restart Convex

After adding the environment variables in the dashboard:
- For development: The changes are automatically picked up
- For production: Redeploy your Convex functions

No need to restart Next.js as these are backend-only variables.

## How It Works

### Token Generation Flow

1. When a user clicks "Join Video Call" on a confirmed booking
2. The `VideoCall` component requests a token from the Convex backend
3. The backend generates a secure token using HMAC-SHA256 signature
4. The token is returned to the client with the App ID
5. Zego UIKit initializes with the token and joins the room

### Video Call Features

- **One-on-One Calling**: Configured for tutor-student sessions
- **Screen Sharing**: Built-in screen sharing capability
- **Pre-Join View**: Preview camera/mic before joining
- **Auto Camera/Mic**: Automatically enables camera and microphone
- **Leave Confirmation**: Confirms before leaving the call
- **Full Screen**: Immersive full-screen video experience

### Room Naming Convention

Each booking uses its unique booking ID as the room ID, ensuring:
- Only the two parties can join the same room
- Rooms are automatically created on first join
- No room collision between different bookings

## Components

### VideoCall Component
**Location**: `/app/bookings/components/VideoCall.tsx`

Props:
- `bookingId`: Unique identifier for the booking (used as room ID)
- `userName`: Display name of the current user
- `userId`: Unique user identifier
- `onClose`: Callback when the call ends

### Zego HTTP Endpoint
**Location**: `/convex/zego.ts`

Provides a secure token generation endpoint at `/zego-token` that:
- Validates user and room IDs
- Generates HMAC-SHA256 signatures
- Returns tokens with 1-hour validity
- Includes login and publish stream privileges

## Booking Schema Updates

The bookings table includes optional video call tracking fields:

```typescript
{
  videoCallStartedAt?: number;  // Timestamp when call started
  videoCallEndedAt?: number;    // Timestamp when call ended
  videoCallDuration?: number;   // Duration in seconds
}
```

These fields can be used to track:
- Call history
- Session duration for billing
- Analytics and reporting

## Usage

### For Users

1. Navigate to `/bookings`
2. Find a booking with **confirmed** status
3. Click the **"🎥 Join Video Call"** button
4. Allow camera and microphone permissions when prompted
5. Wait for the other party to join
6. Use the video controls to mute/unmute, share screen, etc.
7. Click **"✕ Close Call"** or leave through the Zego UI to end

### Video Call States

- **Loading**: Connecting to the video service
- **Error**: Shows error message if connection fails
- **Active**: Full-screen video calling interface

### When Video Call Button Appears

The video call button only appears when:
- Booking status is `confirmed`
- Both parties have accepted the booking
- Payment has been completed

## Security

### Token Security
- Tokens are generated server-side using your server secret
- Tokens expire after 1 hour
- Each token is specific to a user and room
- HMAC-SHA256 signature prevents tampering

### Room Access
- Only users with valid tokens can join
- Room ID is based on booking ID
- Only booking participants (fromUser and toUser) can access

## Customization

### Change Call Duration
Modify the `effectiveTime` in `/convex/zego.ts`:

```typescript
const effectiveTime = 3600; // 1 hour in seconds
```

### Change Video Layout
Modify the scenario in `/app/bookings/components/VideoCall.tsx`:

```typescript
scenario: {
  mode: ZegoUIKitPrebuilt.OneONoneCall, // or GroupCall, etc.
}
```

### Disable Features
Customize the `joinRoom` configuration:

```typescript
zp.joinRoom({
  // ...existing config
  showScreenSharingButton: false, // Disable screen sharing
  turnOnCameraWhenJoining: false, // Don't auto-enable camera
  turnOnMicrophoneWhenJoining: false, // Don't auto-enable mic
});
```

## Troubleshooting

### "Failed to get video call token"
- Check that environment variables are set in Convex Dashboard
- Ensure Convex backend is running
- Verify NEXT_PUBLIC_CONVEX_URL is correct in `.env.local`

### "Zego credentials not configured"
- Add ZEGO_APP_ID, ZEGO_APP_SIGN, and ZEGO_SERVER_SECRET to Convex Dashboard
- Wait a moment for Convex to pick up the new environment variables
- Check the Convex logs for any errors

### Camera/Microphone Not Working
- Check browser permissions
- Ensure HTTPS in production (required for WebRTC)
- Try a different browser

### Other Party Can't Join
- Verify both users have confirmed booking status
- Check that both users are using the same booking ID
- Ensure both have valid tokens

## Production Deployment

### Environment Variables
Ensure all environment variables are set in the Convex Dashboard for both development and production deployments:
- `ZEGO_APP_ID`
- `ZEGO_APP_SIGN`
- `ZEGO_SERVER_SECRET`

Also ensure `NEXT_PUBLIC_CONVEX_URL` is set correctly in your Next.js deployment platform.

### HTTPS Required
WebRTC (used by Zego Cloud) requires HTTPS in production. Ensure your deployment platform provides SSL certificates.

### Token Expiry
Token validity is set to 1 hour. If you need longer sessions, modify the `effectiveTime` constant in `/convex/zego.ts`.

## Resources

- [Zego Cloud Documentation](https://docs.zegocloud.com/)
- [Zego UIKit React Documentation](https://docs.zegocloud.com/article/14963)
- [Zego Console](https://console.zegocloud.com)

## Future Enhancements

Potential improvements:
- Add call recording functionality
- Implement call quality metrics
- Add waiting room for calls
- Send notifications when other party joins
- Track call duration automatically in the database
- Add call history view in booking details
