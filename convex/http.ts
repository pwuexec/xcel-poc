import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { handleDailyRoomOptions, createDailyRoom } from "./daily";
import { handleStripeWebhook } from "./stripe";

const http = httpRouter();

auth.addHttpRoutes(http);

// CORS preflight
http.route({
    path: "/daily-room",
    method: "OPTIONS",
    handler: handleDailyRoomOptions,
});

// POST -> create Daily.co room
http.route({
    path: "/daily-room",
    method: "POST",
    handler: createDailyRoom,
});

// Stripe webhook
http.route({
    path: "/stripe/webhook",
    method: "POST",
    handler: handleStripeWebhook,
});

export default http;
