// src/lib/auth.ts
// Better Auth server instance.
// Plugins:
//   - emailAndPassword  — sign-in/sign-up with email + password
//   - organization      — Restaurant tenants (owner / admin / staff roles)
//   - admin             — Platform-level super_admin flag (user.role)
//
// Usage: import { auth } from "@/lib/auth"

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { admin } from "better-auth/plugins";
import { ac, roles } from "@/lib/permissions";
import { db } from "@/lib/db";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "rms_default_secret_key_32_characters_long_minimum",
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  // -------------------------------------------------------------------------
  // Email & Password
  // -------------------------------------------------------------------------
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  // -------------------------------------------------------------------------
  // Session
  // -------------------------------------------------------------------------
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache
    },
  },

  // -------------------------------------------------------------------------
  // Plugins
  // -------------------------------------------------------------------------
  plugins: [
    organization({
      // Allow any authenticated user to create an organization (restaurant).
      // The proxy gate ensures owners always go through the onboarding flow.
      allowUserToCreateOrganization: true,
      // The user who creates the org gets the "owner" role.
      creatorRole: "owner",
      // Custom access control & roles defined in permissions.ts
      ac,
      roles,
    }),

    // Admin plugin — provides user.role = "super_admin" for platform-level access.
    admin(),
  ],
});

export type Session = typeof auth.$Infer.Session;
