// src/lib/require-role.ts
// Server-side role enforcement helpers.
//
// Call one of these at the top of every Server Action or Route Handler
// before touching Prisma — never trust client-supplied roles or restaurantId.
//
// Usage:
//   const ctx = await getRestaurantContext();           // resolves session + active org + member
//   const ctx = await requireRole(["owner", "admin"]); // throws if caller lacks the role
//   await requireSuperAdmin();                          // throws if caller is not super_admin

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OrgRole = "owner" | "admin" | "staff";

export interface RestaurantContext {
  userId: string;
  restaurantId: string; // Better Auth organizationId
  role: OrgRole;
  isSuperAdmin: false;
}

export interface SuperAdminContext {
  userId: string;
  isSuperAdmin: true;
}

export type AuthContext = RestaurantContext | SuperAdminContext;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolves the current session. Throws "Not authenticated" if there is none.
 */
async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  return session;
}

/**
 * Returns the full auth context for the calling user:
 * - If the user is a super_admin → SuperAdminContext
 * - Otherwise → RestaurantContext (resolves their active org membership)
 *
 * Throws if the user has no active organization membership.
 */
export async function getRestaurantContext(): Promise<AuthContext> {
  const session = await getSession();

  // Super Admin — platform-wide, not org-scoped.
  if ((session.user as { role?: string }).role === "super_admin") {
    return { userId: session.user.id, isSuperAdmin: true };
  }

  // Resolve the active organization membership.
  let member = await auth.api.getActiveMember({
    headers: await headers(),
  });

  if (!member) {
    try {
      const userOrgs = await auth.api.listOrganizations({
        headers: await headers(),
      });

      if (userOrgs && userOrgs.length > 0) {
        await auth.api.setActiveOrganization({
          body: { organizationId: userOrgs[0].id },
          headers: await headers(),
        });
        member = await auth.api.getActiveMember({
          headers: await headers(),
        });
      }
    } catch {
      // Ignore fallback errors
    }
  }

  if (!member) {
    throw new Error(
      "No active restaurant. Please select or create a restaurant first."
    );
  }

  return {
    userId: session.user.id,
    restaurantId: member.organizationId,
    role: member.role as OrgRole,
    isSuperAdmin: false,
  };
}

/**
 * Ensures the caller has one of the allowed org roles.
 * Super Admins bypass this check and are always allowed.
 *
 * Returns the resolved context on success, throws on failure.
 */
export async function requireRole(
  allowed: OrgRole[]
): Promise<AuthContext> {
  const ctx = await getRestaurantContext();

  // Super Admin bypasses all org-scoped role checks.
  if (ctx.isSuperAdmin) return ctx;

  if (!allowed.includes((ctx as RestaurantContext).role)) {
    throw new Error(
      `Unauthorized: action requires one of [${allowed.join(", ")}]`
    );
  }

  return ctx;
}

/**
 * Ensures the caller is a Super Admin. Throws for everyone else.
 */
export async function requireSuperAdmin(): Promise<SuperAdminContext> {
  const session = await getSession();

  if ((session.user as { role?: string }).role !== "super_admin") {
    throw new Error("Unauthorized: Super Admin access required");
  }

  return { userId: session.user.id, isSuperAdmin: true };
}

/**
 * Returns the restaurantId for the caller's active organization.
 * Throws if there is no active org or if the caller is a Super Admin
 * (who is not scoped to any single restaurant).
 */
export async function getActiveRestaurantId(): Promise<string> {
  const ctx = await getRestaurantContext();
  if (ctx.isSuperAdmin) {
    throw new Error("Super Admin is not scoped to a single restaurant");
  }
  return (ctx as RestaurantContext).restaurantId;
}
