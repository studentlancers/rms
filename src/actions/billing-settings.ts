"use server";

// src/actions/billing-settings.ts
// Server Actions for managing restaurant billing charge defaults.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, getRestaurantContext } from "@/lib/require-role";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const billingSettingsSchema = z.object({
  defaultPackagingCharge: z.number().min(0, "Packaging charge default must be at least 0"),
  defaultServiceCharge: z.number().min(0, "Service charge default must be at least 0"),
  defaultSplittingCharge: z.number().min(0, "Splitting charge default must be at least 0"),
});

async function getEffectiveRestaurantId(): Promise<string> {
  const ctx = await getRestaurantContext();
  if (!ctx.isSuperAdmin) {
    return ctx.restaurantId;
  }

  const member = await auth.api.getActiveMember({ headers: await headers() }).catch(() => null);
  if (member?.organizationId) {
    return member.organizationId;
  }
  const userOrgs = await auth.api.listOrganizations({ headers: await headers() }).catch(() => null);
  if (userOrgs && userOrgs.length > 0) {
    return userOrgs[0].id;
  }

  const firstOrg = await db.organization.findFirst();
  if (firstOrg) {
    return firstOrg.id;
  }

  throw new Error("No restaurant organization found");
}

/**
 * Returns default billing charge settings for the active restaurant.
 * Accessible to owner, admin, staff.
 */
export async function getBillingSettings() {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getEffectiveRestaurantId();

  const settings = await db.restaurantSettings.findUnique({
    where: { restaurantId },
  });

  if (!settings) {
    return {
      defaultPackagingCharge: 0,
      defaultServiceCharge: 0,
      defaultSplittingCharge: 0,
    };
  }

  return {
    defaultPackagingCharge: settings.defaultPackagingCharge,
    defaultServiceCharge: settings.defaultServiceCharge,
    defaultSplittingCharge: settings.defaultSplittingCharge,
  };
}

/**
 * Updates default billing charge settings for the active restaurant.
 * Owner / Admin only.
 */
export async function updateBillingSettings(data: {
  defaultPackagingCharge: number;
  defaultServiceCharge: number;
  defaultSplittingCharge: number;
}) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getEffectiveRestaurantId();

  const parsed = billingSettingsSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const { defaultPackagingCharge, defaultServiceCharge, defaultSplittingCharge } = parsed.data;

  const updated = await db.restaurantSettings.upsert({
    where: { restaurantId },
    update: {
      defaultPackagingCharge,
      defaultServiceCharge,
      defaultSplittingCharge,
    },
    create: {
      restaurantId,
      defaultPackagingCharge,
      defaultServiceCharge,
      defaultSplittingCharge,
    },
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/staff", "layout");

  return {
    defaultPackagingCharge: updated.defaultPackagingCharge,
    defaultServiceCharge: updated.defaultServiceCharge,
    defaultSplittingCharge: updated.defaultSplittingCharge,
  };
}

