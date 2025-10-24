# Bookings Feature

A comprehensive bookings management system built with Next.js 16, Convex, and Tailwind CSS 4 with full event history audit trail.

## Features

- **View Bookings**: Display all your bookings with status filters
- **Create Bookings**: Modal form to create new bookings with date/time picker
- **Status Management**: Filter bookings by status (all statuses supported)
- **Accept/Reject Bookings**: Accept or reject pending booking requests
- **Reschedule Bookings**: Modify booking dates and times with ping-pong confirmation flow
- **Cancel Bookings**: Cancel bookings that are not yet completed
- **Event History**: Complete audit trail of all booking actions with timestamps
- **Chat Messages**: Real-time messaging between booking parties within each booking card
- **Payment**: Students can pay for bookings via Stripe integration (coming soon)
- **Auto-Complete**: Bookings are automatically completed by cron job
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS 4
- **Dark Mode**: Full dark mode support

## Key Workflows

### Reschedule Ping-Pong Flow
When a user (tutor or student) proposes a reschedule:
1. User clicks "Reschedule" and selects new date/time
2. Booking status changes to `awaiting_reschedule`
3. The `lastActionByUserId` tracks who proposed the reschedule
4. The **other party** must accept or reject the reschedule
5. The proposer **cannot** reschedule again until the other party responds
6. Error shown: "You have already proposed a reschedule. Please wait for the other party to respond."
7. Once accepted, booking moves to `awaiting_payment` status
8. If rejected, booking returns to `rejected` status

### Event History Audit Trail
Every action on a booking is logged with:
- Timestamp of the action
- User who performed the action
- Action type (created, accepted, rejected, rescheduled, canceled, completed)
- Details of the action (e.g., old and new times for reschedules)
- Collapsible view in the UI for easy audit review

## Booking Statuses

1. **pending** - Initial status when a booking is created
2. **awaiting_payment** - When booking is accepted and payment is pending (automatically set on acceptance)
3. **processing_payment** - When payment is being processed
4. **confirmed** - When payment is confirmed and booking is finalized
5. **completed** - When booking session is finished
6. **canceled** - When booking is canceled by either party
7. **rejected** - When booking is rejected, suggesting a new time needed
8. **awaiting_reschedule** - One party proposed a reschedule, the other must accept/reject (use `lastActionByUserId` to determine who proposed)

## Pages

### `/bookings`
Main bookings page showing all user bookings with:
- Filter tabs (All, Pending, Accepted, Confirmed, Pending Reschedule, Canceled, Rejected, Completed)
- Booking cards with user info and timestamps
- Action buttons based on booking status
- Collapsible event history for each booking
- Create booking button

## Components

### `BookingsPage` (`/app/bookings/page.tsx`)
Main page component that:
- Fetches bookings using Convex query
- Displays filtered bookings based on selected status
- Shows loading and empty states
- Integrates all booking action buttons including payment

### `CreateBookingForm` (`/app/bookings/components/CreateBookingForm.tsx`)
Modal form component for creating new bookings with:
- User selection (tutor)
- Date picker
- Time picker
- Form validation

### `RescheduleBookingForm` (`/app/bookings/components/RescheduleBookingForm.tsx`)
Modal form component for rescheduling bookings with:
- Pre-filled current date/time
- New date picker
- New time picker
- Form validation

### `PaymentButton` (`/app/bookings/components/PaymentButton.tsx`)
Payment component for processing bookings:
- Only visible to non-tutors (students, admins)
- Only shows when booking status is `awaiting_payment`
- Placeholder for Stripe integration
- Handles payment processing state
- Will update booking to `processing_payment` then `confirmed` upon successful payment

### `BookingChat` (`/app/bookings/components/BookingChat.tsx`)
Real-time chat component for booking communication:
- Collapsible message interface within each booking card
- Shows message count and unread count in header
- **Red notification badge** on chat icon when there are unread messages
- **Unread indicator** in subtitle showing count of unread messages
- Real-time message display with user avatars and timestamps
- Messages aligned based on sender (right for current user, left for other party)
- Character limit of 1000 characters per message
- Auto-scroll to latest message
- **Auto-marks messages as read** when chat is opened
- Only visible to booking participants (fromUser and toUser)
- Messages persist across bookings for the same parties

### `BookingCard`
Booking display card with:
- User avatar and information
- Booking date and time
- Status badge with color coding
- **Payment Button**: Shows for non-tutors when status is `awaiting_payment`
  - Placeholder for Stripe integration
  - Disabled during processing
  - Only visible to non-tutor users (students, admins)
- **Chat Messages**: Collapsible real-time messaging interface
  - Message count indicator
  - Bubble-style messages with sender info
  - Auto-scroll to latest messages
  - Send messages up to 1000 characters
  - Only visible to booking participants
- **Collapsible Event History**: Shows complete audit trail of all actions
  - Action icons (📝 created, ✅ accepted, ❌ rejected, 📅 rescheduled, 🚫 canceled, ✔️ completed)
  - User who performed each action
  - Timestamps for all events
  - Detailed descriptions of actions
- Context-aware action buttons:
  - **Awaiting Payment**: Pay Now button (non-tutors only)
  - **Pending/Pending Reschedule**: Accept, Reject, Reschedule, Cancel
    - Note: Cannot accept your own reschedule proposal
  - **Other active statuses**: Reschedule, Cancel
  - **Completed/Canceled**: No actions available

## Convex Backend

### Schema (`/convex/schemas/bookings.ts`)
- `bookings` table with comprehensive status tracking
- **Event history array**: Complete audit trail of all actions
- **lastActionByUserId**: Tracks who made the last action (for reschedule ping-pong)
- Indexes on `fromUserId` and `toUserId`
- Full status union type with 8 possible states
- Event objects with timestamp, userId, action, and optional details

### Schema (`/convex/schemas/messages.ts`)
- `messages` table for chat functionality
- Links messages to bookings via `bookingId`
- Stores userId, message text, timestamp, and `readBy` array
- `readBy` tracks which users have read each message
- Indexes on `bookingId` and `timestamp` for efficient queries
- Messages enriched with user info (name, image) on retrieval

### Queries
- `getMyBookings`: Fetches current user's bookings with user details and enriched event history
- `getBookingMessages`: Fetches all messages for a specific booking with user info
- `getUnreadCount`: Returns count of unread messages for a specific booking

### Mutations
- `createBooking`: Creates a new booking with pending status and logs creation event
- `acceptBooking`: Accepts a pending or pending_reschedule booking
  - Validates that user didn't propose the reschedule (ping-pong check)
  - Logs acceptance event with details
- `rejectBooking`: Rejects a pending or pending_reschedule booking and logs event
- `cancelBooking`: Cancels any active booking (not completed/canceled) and logs event
- `rescheduleBooking`: Updates booking time, sets to pending_reschedule, logs event with old/new times
  - Tracks proposer via lastActionByUserId for ping-pong validation
- `sendMessage`: Sends a chat message for a booking
  - Validates user is part of the booking
  - Enforces 1000 character limit
  - Automatically timestamps messages
  - Marks sender as having read their own message
- `markMessagesAsRead`: Marks all messages in a booking as read by current user
  - Called automatically when chat is opened
  - Updates readBy array for unread messages

### Cron Jobs
- Booking completion is handled automatically by cron job (not exposed in UI)

## Usage

### Creating a Booking
1. Navigate to `/bookings`
2. Click "Create New Booking"
3. Select a tutor from dropdown
4. Choose date and time
5. Click "Create" to submit

### Managing Bookings
1. View all bookings with color-coded status badges
2. Use filter tabs to view specific status groups
3. Take actions based on booking status:
   - **Pay** (non-tutors only) when booking is awaiting payment
   - **Accept** pending bookings to move forward (cannot accept your own reschedule)
   - **Reject** bookings if time doesn't work
   - **Reschedule** to propose new date/time (other party must accept)
   - **Cancel** to cancel the booking
4. **Chat** with the other party directly within the booking card
5. Expand "Event History" to see complete audit trail of all actions

### Rescheduling Flow (Ping-Pong)
1. Click "Reschedule" on any active booking
2. Select new date and time in modal
3. Click "Reschedule" to update
4. Booking status changes to `awaiting_reschedule` (use `lastActionByUserId` to track who proposed)
5. **The other party** receives the reschedule request
6. They can **Accept** or **Reject** the new time
7. The proposer **cannot reschedule again** until the other party responds
8. Error shown if trying to reschedule again: "You have already proposed a reschedule. Please wait for the other party to respond."
9. Once accepted, booking moves to "awaiting_payment" status
10. If rejected, booking moves to "rejected" status

### Event History
1. Each booking card shows "Event History (X)" button
2. Click to expand and view complete audit trail
3. See all actions with:
   - Action icon and type
   - Who performed the action
   - When it happened
   - Details of the action (e.g., time changes)
4. Events are listed chronologically from oldest to newest

### Chat Messages
1. Each booking card shows "💬 Messages with {Name}" button
2. **Red notification badge** appears on the chat icon when you have unread messages
3. Subtitle shows "X unread" in red when there are unread messages
4. Click to expand the chat interface
5. View all messages in bubble-style format:
   - Your messages appear on the right in blue
   - Other party's messages appear on the left
   - Timestamps for each message
6. Type and send messages (up to 1000 characters)
7. Messages auto-scroll to the latest
8. **Messages automatically marked as read** when you open the chat
9. Chat persists across bookings between the same parties
10. Only booking participants can view and send messages

## Payment Flow

### Student Payment Process
1. Once a booking is accepted by both parties, status changes to `awaiting_payment`
2. **Students only** see a "Pay Now" button on bookings with `awaiting_payment` status
3. Clicking "Pay Now" will:
   - Initialize Stripe payment flow (to be integrated)
   - Update booking status to `processing_payment`
   - Upon successful payment, update to `confirmed`
4. Tutors and admins do not see the payment button
5. Payment component is separate and ready for Stripe integration

### Stripe Integration (Coming Soon)
The `PaymentButton` component is designed to integrate with Stripe:
- Create payment intent with booking details
- Open Stripe checkout or payment modal
- Handle payment success/failure callbacks
- Automatically update booking status based on payment result

## Styling

Built with Tailwind CSS 4 featuring:
- Zinc color palette for modern look
- Status-specific color schemes:
  - Yellow: Pending
  - Purple: Payment statuses (Awaiting Payment, Processing Payment)
  - Green: Confirmed/Completed
  - Orange: Awaiting Reschedule
  - Red: Canceled/Rejected
  - Gray: Completed
- Consistent spacing and typography
- Smooth transitions and hover effects
- Full dark mode support
- Responsive action buttons
