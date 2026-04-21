import CredentialsProvider from "next-auth/providers/credentials";

import { authorizeWithPassword } from "@/auth/credentials";

export function createAuthProviders() {
  return [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        return authorizeWithPassword(credentials.email, credentials.password);
      },
    }),
  ];
}
