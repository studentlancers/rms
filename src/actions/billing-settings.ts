"use server";

// src/actions/billing-settings.ts
// Server Actions for managing restaurant billing charge defaults.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, getActiveRestaurantId } from "@/lib/require-role";

import { moneySchema } from "@/lib/validation";

const billingSettingsSchema = z.object({
  defaultPackagingCharge: moneySchema("Packaging charge default", 5000).default(0),
  defaultServiceCharge: moneySchema("Service charge default", 10000).default(0),
  defaultSplittingCharge: moneySchema("Splitting charge default", 5000).default(0),
});

/**
 * Returns default billing charge settings for the active restaurant.
 * Accessible to owner, admin, staff.
 */
export async function getBillingSettings() {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

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
  const restaurantId = await getActiveRestaurantId();

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

