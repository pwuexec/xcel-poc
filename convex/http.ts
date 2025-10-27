import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { handleLessonspaceOptions, createLessonspaceSession } from "./lessonspace";
import { handleStripeWebhook } from "./stripe";

const http = httpRouter();

auth.addHttpRoutes(http);

// CORS preflight
http.route({
    path: "/lessonspace-session",
    method: "OPTIONS",
    handler: handleLessonspaceOptions,
});

// POST -> create Lessonspace session
http.route({
    path: "/lessonspace-session",
    method: "POST",
    handler: createLessonspaceSession,
});

// Stripe webhook
http.route({
    path: "/stripe/webhook",
    method: "POST",
    handler: handleStripeWebhook,
});

export default http;
