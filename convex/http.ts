import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { createLessonspaceSession, handleLessonspaceOptions } from "./bookings/integrations/httpActions";
import { handleStripeCheckout, handleStripeWebhook } from "./payments/integrations/httpActions";

const http = httpRouter();

auth.addHttpRoutes(http);


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

// Stripe checkout
http.route({
    path: "/stripe/checkout",
    method: "POST",
    handler: handleStripeCheckout,
});

export default http;
