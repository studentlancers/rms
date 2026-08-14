"use server";

// src/actions/billing-settings.ts
// Server Actions for managing restaurant billing charge defaults.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, getActiveRestaurantId, getRestaurantContext } from "@/lib/require-role";

const billingSettingsSchema = z.object({
  defaultPackagingCharge: z.number().min(0, "Packaging charge default must be at least 0"),
  defaultServiceCharge: z.number().min(0, "Service charge default must be at least 0"),
  defaultSplittingCharge: z.number().min(0, "Splitting charge default must be at least 0"),
});

/**
 * Returns default billing charge settings for the active restaurant.
 * Accessible to owner, admin, staff.
 */
export async function getBillingSettings() {
  const ctx = await getRestaurantContext();
  if (ctx.isSuperAdmin) {
    return {
      defaultPackagingCharge: 0,
      defaultServiceCharge: 0,
      defaultSplittingCharge: 0,
    };
  }

  if (!(db as any).restaurantSettings) {
    return {
      defaultPackagingCharge: 0,
      defaultServiceCharge: 0,
      defaultSplittingCharge: 0,
    };
  }

  const settings = await (db as any).restaurantSettings.findUnique({
    where: { restaurantId: ctx.restaurantId },
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

  if (!(db as any).restaurantSettings) {
    throw new Error("Restaurant settings model not loaded in current database client instance");
  }

  const updated = await (db as any).restaurantSettings.upsert({
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

  return updated;
}
