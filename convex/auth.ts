import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Role } from "./users/types/role";
import Google from "@auth/core/providers/google";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google({
      profile(params, _) {
        return {
          email: params.email as string,
          name: params.name as string,
          role: "user" as Role
        };
      }
    }),
    Password({
      profile(params, _) {
        return {
          email: params.email as string,
          name: params.name as string,
          role: "user" as Role
        };
      }
    })
  ],
});
