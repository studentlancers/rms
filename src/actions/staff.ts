"use server";

// src/actions/staff.ts
// Server Actions for staff management (wraps Better Auth Organization API).
// Owner-only for role changes and removal; Owner/Admin for listing.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requireRole, getActiveRestaurantId } from "@/lib/require-role";
import { headers } from "next/headers";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "staff"]),
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Invites a new staff member (Admin or Staff role) to the restaurant.
 * Owner only. Owners cannot invite other Owners via this action.
 */
export async function inviteStaff(formData: FormData) {
  await requireRole(["owner"]);
  const restaurantId = await getActiveRestaurantId();

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  await auth.api.createInvitation({
    body: {
      email: parsed.data.email,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: parsed.data.role as any,
      organizationId: restaurantId,
    },
    headers: await headers(),
  });

  revalidatePath("/dashboard", "layout");
}

/**
 * Returns the full member list for the active restaurant.
 * Owner and Admin can list staff.
 */
export async function listStaff() {
  try {
    await requireRole(["owner", "admin"]);
    const restaurantId = await getActiveRestaurantId();

    const members = await auth.api.listMembers({
      query: { organizationId: restaurantId },
      headers: await headers(),
    });

    return members;
  } catch (error) {
    console.error("Error in listStaff action:", error);
    return [];
  }
}

/**
 * Returns pending invitations for the active restaurant.
 * Owner only.
 */
export async function listPendingInvitations() {
  try {
    await requireRole(["owner"]);
    const restaurantId = await getActiveRestaurantId();

    const invitations = await auth.api.listInvitations({
      query: { organizationId: restaurantId },
      headers: await headers(),
    });

    return invitations;
  } catch (error) {
    console.error("Error in listPendingInvitations action:", error);
    return [];
  }
}

/**
 * Updates a staff member's role. Owner only.
 * Cannot promote to Owner via this action.
 */
export async function updateStaffRole(
  memberId: string,
  role: "admin" | "staff"
) {
  await requireRole(["owner"]);

  await auth.api.updateMemberRole({
    body: { memberId, role: role as string },
    headers: await headers(),
  });

  revalidatePath("/dashboard", "layout");
}

/**
 * Removes a staff member from the restaurant. Owner only.
 * Uses memberIdOrEmail as required by Better Auth's removeMember API.
 */
export async function removeStaff(memberIdOrEmail: string) {
  await requireRole(["owner"]);

  await auth.api.removeMember({
    body: { memberIdOrEmail },
    headers: await headers(),
  });

  revalidatePath("/dashboard", "layout");
}

/**
 * Cancels a pending invitation. Owner only.
 */
export async function cancelInvitation(invitationId: string) {
  await requireRole(["owner"]);

  await auth.api.cancelInvitation({
    body: { invitationId },
    headers: await headers(),
  });

  revalidatePath("/dashboard", "layout");
}
