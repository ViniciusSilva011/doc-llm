import type { NextAuthOptions } from "next-auth";

import { env } from "@/lib/env";
import { createAuthProviders } from "@/auth/providers";

export const authOptions: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: createAuthProviders(),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = String(user.id);
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = Number(token.sub);
        session.user.role = typeof token.role === "string" ? token.role : "user";
      }

      return session;
    },
  },
};
