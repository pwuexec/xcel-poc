import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Role } from "./schemas/users";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password({
    profile(params, _) {
      return {
        email: params.email as string,
        name: params.name as string,
        role: "user" as Role
      }
    }
  })],
});
