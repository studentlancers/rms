"use server";

// src/actions/staff.ts
// Server Actions for staff management (wraps Better Auth Organization API).
// Owner-only for role changes and removal; Owner/Admin for listing.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireRole, getActiveRestaurantId } from "@/lib/require-role";
import { headers } from "next/headers";

import { sendStaffInvitationEmail } from "@/lib/email";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "staff"]),
});

const createStaffSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "staff"]).default("staff"),
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Invites a new staff member (Admin or Staff role) to the restaurant.
 * Owner only. Owners cannot invite other Owners via this action.
 * Automatically dispatches invitation email.
 */
export async function inviteStaff(formData: FormData) {
  const ctx = await requireRole(["owner"]);
  const restaurantId = await getActiveRestaurantId();

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const invitation = await auth.api.createInvitation({
    body: {
      email: parsed.data.email,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: parsed.data.role as any,
      organizationId: restaurantId,
    },
    headers: await headers(),
  });

  // Fetch organization and inviter user details for email template
  const [org, inviter] = await Promise.all([
    db.organization.findUnique({ where: { id: restaurantId } }),
    db.user.findUnique({ where: { id: ctx.userId } }),
  ]);

  const organizationName = org?.name || "The Good Resto";
  const inviterName = inviter?.name || inviter?.email || "Restaurant Owner";

  const emailRes = await sendStaffInvitationEmail({
    to: invitation.email,
    inviterName,
    organizationName,
    invitationId: invitation.id,
    role: invitation.role || parsed.data.role,
    expiresAt: invitation.expiresAt,
  });

  revalidatePath("/dashboard", "layout");
  return {
    success: true,
    invitationId: invitation.id,
    email: invitation.email,
    role: invitation.role,
    emailSent: emailRes.success,
  };
}

/**
 * Direct Staff Account Creation Action.
 * Owner/Admin creates a Staff account directly with Name, Email, Password, and Role.
 * Uses Better Auth APIs for user creation and password hashing, and links Member
 * to current active organization without sending email invitations.
 */
export async function createStaffAccount(formData: FormData) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const parsed = createStaffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") || "staff",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const { name, email, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    // Check if user is already a member of this restaurant
    const existingMember = await db.member.findFirst({
      where: {
        userId: existingUser.id,
        organizationId: restaurantId,
      },
    });

    if (existingMember) {
      throw new Error("This email is already registered and a member of this restaurant.");
    }

    // Existing user exists in system but not in this org -> Link Member
    try {
      await auth.api.addMember({
        body: {
          userId: existingUser.id,
          role: role,
          organizationId: restaurantId,
        },
        headers: await headers(),
      });
    } catch {
      await db.member.create({
        data: {
          id: "mem_" + Math.random().toString(36).substring(2, 12),
          organizationId: restaurantId,
          userId: existingUser.id,
          role: role,
        },
      });
    }

    revalidatePath("/dashboard", "layout");
    return {
      success: true,
      message: "Existing user added to this restaurant successfully.",
      user: { id: existingUser.id, email: existingUser.email, name: existingUser.name },
    };
  }

  // 2. Create user with Better Auth (native password hashing & credential account linkage)
  const signUpRes = await auth.api.signUpEmail({
    body: {
      name,
      email: normalizedEmail,
      password,
    },
  });

  if (!signUpRes?.user?.id) {
    throw new Error("Failed to create staff account with Better Auth.");
  }

  const createdUserId = signUpRes.user.id;

  // 3. Link new Staff member to owner's active organization
  try {
    await auth.api.addMember({
      body: {
        userId: createdUserId,
        role: role,
        organizationId: restaurantId,
      },
      headers: await headers(),
    });
  } catch {
    await db.member.create({
      data: {
        id: "mem_" + Math.random().toString(36).substring(2, 12),
        organizationId: restaurantId,
        userId: createdUserId,
        role: role,
      },
    });
  }

  revalidatePath("/dashboard", "layout");
  return {
    success: true,
    message: "Staff account created successfully.",
    user: { id: createdUserId, email: normalizedEmail, name },
  };
}

/**
 * Fetches public invitation details for rendering on the accept-invitation page.
 * Accessible publicly without auth checks.
 */
export async function getInvitationDetails(invitationId: string) {
  if (!invitationId) return null;

  try {
    const invitation = await db.invitation.findUnique({
      where: { id: invitationId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) return null;

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role || "staff",
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      isExpired: new Date() > new Date(invitation.expiresAt),
      organizationId: invitation.organizationId,
      organizationName: invitation.organization.name,
      organizationSlug: invitation.organization.slug || "restaurant",
      inviterName: invitation.user?.name || invitation.user?.email || "Restaurant Owner",
    };
  } catch (error) {
    console.error("Error in getInvitationDetails:", error);
    return null;
  }
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

/**
 * Lists salary records for all staff members of active restaurant from database.
 */
export async function listStaffSalaries() {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const membersRes = await listStaff();
  const members = Array.isArray(membersRes) ? membersRes : (membersRes as any)?.members || [];

  const salaries = await db.staffSalary.findMany({
    where: { restaurantId },
  });

  const salaryMap = new Map(salaries.map((s) => [s.userId, s]));

  return members.map((m: any) => {
    const userId = m.user?.id || m.userId || m.id;
    const s = salaryMap.get(userId);
    const monthlySalary = s?.monthlySalary || 0;
    const advancePaid = s?.advancePaid || 0;
    const remainingSalary = Math.max(0, monthlySalary - advancePaid);

    return {
      userId,
      name: m.user?.name || m.name || "Staff Member",
      email: m.user?.email || m.email || "staff@restaurant.com",
      role: m.role || "staff",
      monthlySalary,
      advancePaid,
      remainingSalary,
      lastPaidDate: s?.lastPaidDate ? s.lastPaidDate.toISOString().slice(0, 10) : "Not Disbursed",
      paymentStatus: s?.paymentStatus || (monthlySalary > 0 ? "Pending" : "Not Set"),
    };
  });
}

/**
 * Updates or creates a staff member's salary & disbursement details in PostgreSQL.
 */
export async function updateStaffSalary(
  userId: string,
  data: {
    monthlySalary: number;
    advancePaid?: number;
    paymentStatus?: string;
  }
) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const record = await db.staffSalary.upsert({
    where: {
      restaurantId_userId: {
        restaurantId,
        userId,
      },
    },
    update: {
      monthlySalary: data.monthlySalary,
      advancePaid: data.advancePaid ?? 0,
      paymentStatus: data.paymentStatus ?? "Pending",
      ...(data.paymentStatus === "Paid" ? { lastPaidDate: new Date() } : {}),
    },
    create: {
      restaurantId,
      userId,
      monthlySalary: data.monthlySalary,
      advancePaid: data.advancePaid ?? 0,
      paymentStatus: data.paymentStatus ?? "Pending",
      ...(data.paymentStatus === "Paid" ? { lastPaidDate: new Date() } : {}),
    },
  });

  revalidatePath("/dashboard", "layout");
  return record;
}
