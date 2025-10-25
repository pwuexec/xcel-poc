# Stripe Integration Guide

This project uses Stripe for processing one-off payments for tutoring sessions.

## Setup Instructions

### 1. Get Your Stripe API Keys

1. Sign up or log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → API keys**
3. Copy your **Publishable key** and **Secret key**
4. Add them to your `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Set Up Webhook (for Local Development)

Stripe webhooks notify your app when payment events occur.

#### Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
# Download from https://github.com/stripe/stripe-cli/releases

# Windows
# Download from https://github.com/stripe/stripe-cli/releases
```

#### Login to Stripe CLI

```bash
stripe login
```

#### Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This command will output a webhook signing secret. Copy it to your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Keep the `stripe listen` command running** while developing to receive webhook events.

### 3. Set Application URL

Add your application URL to `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How It Works

### Payment Flow

1. **User clicks "Pay Now"** → `PaymentButton.tsx`
2. **Create checkout session** → `POST /api/stripe/create-checkout-session`
   - Creates Stripe Checkout Session
   - Creates payment record in Convex with status `pending`
   - Updates booking status to `processing_payment`
3. **Redirect to Stripe** → User completes payment on Stripe's secure checkout page
4. **Webhook notification** → `POST /api/stripe/webhook`
   - Stripe sends event (e.g., `checkout.session.completed`)
   - Payment status updated to `succeeded`
   - Booking status updated to `confirmed`
5. **User redirected back** → Success/cancel URLs

### Stripe Events Handled

- `checkout.session.completed` - Payment succeeded
- `checkout.session.expired` - Session expired without payment
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Payment refunded (for future use)

## Payment Schema

Payments are stored in Convex with the following statuses:

- `pending` - Checkout session created, awaiting payment
- `processing` - Payment submitted to Stripe
- `succeeded` - Payment successful ✅
- `failed` - Payment failed ❌
- `canceled` - Payment canceled
- `refunded` - Payment refunded (future use)

## Testing

### Test Cards

Use these test card numbers in development:

| Card Number | Description |
|------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Payment declined |
| `4000 0025 0000 3155` | 3D Secure authentication required |

- Use any future expiry date (e.g., `12/34`)
- Use any 3-digit CVC (e.g., `123`)
- Use any valid ZIP code (e.g., `12345`)

### Testing Webhook Events

With `stripe listen` running, trigger test events:

```bash
# Successful payment
stripe trigger checkout.session.completed

# Failed payment
stripe trigger payment_intent.payment_failed
```

## Production Setup

### 1. Switch to Live Mode

1. In Stripe Dashboard, toggle **Test mode** to **Live mode**
2. Get your **Live API keys** from **Developers → API keys**
3. Update environment variables with live keys

### 2. Configure Production Webhook

1. Go to **Developers → Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing secret** and add to production environment variables

### 3. Update Environment Variables

```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Pricing Configuration

Currently, all sessions are priced at **$50.00** (hardcoded in `create-checkout-session/route.ts`).

### To Add Dynamic Pricing

1. Add `price` field to bookings schema
2. Update `createBooking` mutation to accept price
3. Fetch booking in checkout session creation:

```typescript
// In create-checkout-session/route.ts
const booking = await fetchQuery(api.schemas.bookings.getBooking, { 
  bookingId 
});

const amount = booking.price * 100; // Convert dollars to cents
```

## Future: Recurring Subscriptions

For recurring tutoring sessions, you can use Stripe Subscriptions:

1. Create **Products** and **Prices** in Stripe Dashboard
2. Use `mode: 'subscription'` instead of `mode: 'payment'`
3. Handle subscription events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## Troubleshooting

### Webhook not receiving events

- Ensure `stripe listen` is running
- Check webhook secret is correct
- Verify endpoint URL is accessible

### Payment not updating booking status

- Check Convex logs for errors
- Verify webhook secret matches
- Ensure payment table exists in schema

### Redirect to Stripe fails

- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Check browser console for errors
- Ensure `NEXT_PUBLIC_APP_URL` is correct

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
