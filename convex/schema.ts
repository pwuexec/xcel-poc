import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { bookings } from "./schemas/bookings";
import { users } from "./schemas/users";
import { messages } from "./schemas/messages";
import { whiteboards } from "./schemas/whiteboards";
import { payments } from "./schemas/payments";


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
   * Whiteboards
   */
  whiteboards,

  /**
   * Payments (Stripe)
   */
  payments
});

export default schema;