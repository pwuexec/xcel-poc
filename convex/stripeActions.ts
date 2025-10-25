"use node";

import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import Stripe from "stripe";

// Internal Node.js action to process webhook
export const processStripeWebhook = internalAction({
    args: {
        body: v.string(),
        signature: v.string(),
    },
    handler: async (ctx, args) => {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-09-30.clover",
        });
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(
                args.body,
                args.signature,
                webhookSecret
            );
        } catch (err: any) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            throw new Error(`Webhook Error: ${err.message}`);
        }

        // Handle the event
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;

                await ctx.runMutation(internal.schemas.payments.updatePaymentStatus, {
                    stripeSessionId: session.id,
                    stripePaymentIntentId: session.payment_intent as string,
                    status: "succeeded",
                });

                console.log(`Payment succeeded for session: ${session.id}`);
                break;
            }

            case "checkout.session.expired": {
                const session = event.data.object as Stripe.Checkout.Session;

                await ctx.runMutation(internal.schemas.payments.updatePaymentStatus, {
                    stripeSessionId: session.id,
                    status: "canceled",
                });

                console.log(`Payment session expired: ${session.id}`);
                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;

                // Find the checkout session by payment intent ID
                const sessions = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntent.id,
                    limit: 1,
                });

                if (sessions.data.length > 0) {
                    await ctx.runMutation(internal.schemas.payments.updatePaymentStatus, {
                        stripeSessionId: sessions.data[0].id,
                        stripePaymentIntentId: paymentIntent.id,
                        status: "failed",
                    });
                }

                console.log(`Payment failed for intent: ${paymentIntent.id}`);
                break;
            }

            case "charge.refunded": {
                const charge = event.data.object as Stripe.Charge;

                if (charge.payment_intent) {
                    // Find the checkout session by payment intent ID
                    const sessions = await stripe.checkout.sessions.list({
                        payment_intent: charge.payment_intent as string,
                        limit: 1,
                    });

                    if (sessions.data.length > 0) {
                        await ctx.runMutation(
                            internal.schemas.payments.updatePaymentStatus,
                            {
                                stripeSessionId: sessions.data[0].id,
                                stripePaymentIntentId: charge.payment_intent as string,
                                status: "refunded",
                            }
                        );
                    }
                }

                console.log(`Charge refunded: ${charge.id}`);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
    },
});

// Create Checkout Session Action (Node.js)
export const createCheckoutSession = action({
    args: {
        bookingId: v.id("bookings"),
        customerName: v.optional(v.string()),
        customerEmail: v.string(),
    },
    handler: async (ctx, args) => {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-09-30.clover",
        });

        // Get booking to verify it exists and get user ID
        const booking = await ctx.runQuery(
            internal.schemas.bookings.getBookingById,
            {
                bookingId: args.bookingId,
            }
        );

        if (!booking) {
            throw new Error("Booking not found");
        }

        // Get booking details to calculate amount
        // For now, using a fixed amount (e.g., £50.00 for tutoring session)
        const amount = 5000; // £50.00 in pence
        const currency = "gbp";

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            customer_email: args.customerEmail,
            line_items: [
                {
                    price_data: {
                        currency,
                        product_data: {
                            name: "Tutoring Session",
                            description: `Booking ID: ${args.bookingId}`,
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.SITE_URL}/bookings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.SITE_URL}/bookings?payment=canceled`,
            metadata: {
                bookingId: args.bookingId,
            },
        });

        // Create payment record in Convex
        await ctx.runMutation(internal.schemas.payments.createPaymentInternal, {
            bookingId: args.bookingId,
            userId: booking.fromUserId,
            stripeSessionId: session.id,
            amount,
            currency,
        });

        return { sessionId: session.id, url: session.url };
    },
});
