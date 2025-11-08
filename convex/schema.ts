import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { users } from "./users/schema";
import { messages } from "./messages/schema";
import { recurringRules } from "./recurringRules/schema";
import { bookings } from "./bookings/schema";
import { payments } from "./payments/schema";

const schema = defineSchema({
  ...authTables,

  /**
  * Users
  */
  users,

  /**
   * Bookings
   */
  bookings,

  /**
   * Messages
   */
  messages,

  /**
   * Payments (Stripe)
   */
  payments,

  /**
   * Recurring Rules (for automatic booking creation)
   */
  recurringRules,
});

export default schema;