// src/lib/auth-client.ts
// Better Auth client instance — used in Client Components and the auth context.
// Import { authClient } from "@/lib/auth-client"

import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { ac, roles } from "@/lib/permissions";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [
    organizationClient({
      ac,
      roles,
    }),
    adminClient(),
  ],
});

// Re-export commonly used hooks and methods for convenience.
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
} = authClient;
