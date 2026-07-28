"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * useAuth
 * Wraps Better Auth's useSession + useActiveOrganization (Organization plugin)
 * into one hook, and derives the current role for HMS's 4-role model
 * (Super Admin, Owner, Admin, Staff).
 *
 * Assumes:
 * - lib/auth-client.ts exports `authClient` from createAuthClient()
 * - Organization plugin is registered on both server and client
 * - member.role on the active org membership holds "owner" | "admin" | "staff"
 * - Super Admin is a top-level user field (e.g. user.role === "superadmin"
 *   via the Admin plugin) rather than an org membership
 */

export type HmsRole = "superadmin" | "owner" | "admin" | "staff" | null;

export function useAuth() {
  const {
    data: session,
    isPending: isSessionPending,
    error: sessionError,
    refetch: refetchSession,
  } = authClient.useSession();

  const {
    data: activeOrg,
    isPending: isOrgPending,
    error: orgError,
  } = authClient.useActiveOrganization();

  const {
    data: organizations,
    isPending: isListOrgsPending,
  } = authClient.useListOrganizations();

  useEffect(() => {
    if (
      session?.user &&
      !isOrgPending &&
      !isListOrgsPending &&
      !activeOrg &&
      organizations &&
      organizations.length > 0
    ) {
      const savedOrgId =
        typeof window !== "undefined"
          ? localStorage.getItem("better-auth.activeOrgId")
          : null;
      const targetOrg =
        organizations.find((o) => o.id === savedOrgId) || organizations[0];
      if (targetOrg?.id) {
        authClient.organization.setActive({ organizationId: targetOrg.id });
        if (typeof window !== "undefined") {
          localStorage.setItem("better-auth.activeOrgId", targetOrg.id);
        }
      }
    }
  }, [session, isOrgPending, isListOrgsPending, activeOrg, organizations]);

  const user = session?.user ?? null;

  // Super Admin comes from the Admin plugin's user-level role field.
  // Everyone else's role comes from their membership in the active org.
  const activeMember = activeOrg?.members?.find(
    (m) => m.userId === user?.id
  );

  const role: HmsRole =
    (user as { role?: string } | null)?.role === "superadmin"
      ? "superadmin"
      : (activeMember?.role as HmsRole) ?? null;

  const isPending = isSessionPending || isOrgPending;
  const error = sessionError || orgError;
  const isAuthenticated = !!user && !isSessionPending;

  // Convenience gate: has the current Owner completed the mandatory
  // restaurant-creation onboarding? Adjust the field name to whatever
  // you store this flag as (e.g. activeOrg.metadata.onboarded).
  const needsOnboarding =
    role === "owner" &&
    !!activeOrg &&
    !(activeOrg as { metadata?: { onboarded?: boolean } }).metadata
      ?.onboarded;

  return {
    user,
    session,
    activeOrg,
    role,
    isAuthenticated,
    isPending,
    error,
    needsOnboarding,
    refetchSession,
  };
}