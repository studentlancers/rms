"use server";

// src/actions/restaurants.ts
// Server Actions for restaurant (Better Auth organization) management.
// Owners create their own restaurants; Super Admins can view and manage all.

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/require-role";
import { z } from "zod";

import { trimmedString, slugSchema } from "@/lib/validation";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const createSchema = z.object({
  name: trimmedString(2, 100, "Restaurant name"),
  slug: slugSchema,
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Creates a new restaurant (Better Auth organization) for the calling owner.
 * Called as a form action from /onboarding/create-restaurant.
 * On success, sets the new org as the active organization and redirects to /owner.
 */
export async function createRestaurant(formData: FormData) {
  // Must be authenticated.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/signin");

  // Super Admins cannot create restaurants.
  if ((session.user as { role?: string }).role === "super_admin") {
    throw new Error("Super Admins cannot create restaurants");
  }

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const { name, slug } = parsed.data;

  // Create the Better Auth organization. The calling user becomes the owner.
  const newOrg = await auth.api.createOrganization({
    body: { name, slug },
    headers: await headers(),
  });

  // Automatically set the new restaurant as the active organization on the session.
  if (newOrg?.id) {
    await auth.api.setActiveOrganization({
      body: { organizationId: newOrg.id },
      headers: await headers(),
    });
  }

  redirect(`/dashboard/${slug}`);
}

/**
 * Returns all restaurants (organizations) on the platform.
 * Super Admin only.
 */
export async function listAllRestaurants() {
  await requireSuperAdmin();

  const orgs = await auth.api.listOrganizations({
    headers: await headers(),
  });

  return orgs;
}

/**
 * Returns the calling user's active organization (restaurant).
 */
export async function getActiveRestaurant() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Not authenticated");

  const org = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  return org;
}

/**
 * Updates a restaurant's metadata. Owners can update their own restaurant;
 * Super Admins can update any restaurant (e.g. to suspend it).
 */
export async function updateRestaurant(
  organizationId: string,
  data: { name?: string; metadata?: Record<string, unknown> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Not authenticated");

  await auth.api.updateOrganization({
    body: { data, organizationId },
    headers: await headers(),
  });
}
