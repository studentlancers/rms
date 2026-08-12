"use server";

// src/actions/inventory.ts
// Server Actions for Inventory Management & Stock Control.
// Scope: Tenant isolated by active restaurantId.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, getActiveRestaurantId } from "@/lib/require-role";
import type { MovementType } from "@prisma/client";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createInventoryItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative").default(0),
  unit: z.string().min(1, "Unit is required").default("unit"),
  unitCost: z.coerce.number().min(0, "Unit cost cannot be negative").default(0),
  minReorderLevel: z.coerce.number().min(0).default(10),
  supplierId: z.string().optional(),
});

const updateInventoryItemSchema = createInventoryItemSchema.partial();

const adjustStockSchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory Item ID is required"),
  newQuantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  type: z.enum(["OPENING_STOCK", "PURCHASE", "USAGE", "ADJUSTMENT", "WASTAGE"]).default("ADJUSTMENT"),
  reason: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Returns list of inventory items for the calling user's active restaurant.
 * Optionally filter by category.
 */
export async function listInventoryItems(categoryId?: string) {
  try {
    await requireRole(["owner", "admin", "staff"]);
    const restaurantId = await getActiveRestaurantId();

    const items = await db.inventoryItem.findMany({
      where: {
        restaurantId,
        ...(categoryId && categoryId !== "All" ? { category: categoryId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        supplier: true,
      },
    });

    return items.map((item) => {
      const isLow = item.quantity <= item.minReorderLevel;
      const percentage = Math.min(
        100,
        Math.max(0, Math.round((item.quantity / (item.minReorderLevel * 3 || 100)) * 100))
      );
      return {
        ...item,
        status: isLow ? ("Low" as const) : ("Healthy" as const),
        percentage,
        onHandFormatted: `${item.quantity} ${item.unit}`,
        unitCostFormatted: `₹${item.unitCost.toFixed(2)} / ${item.unit}`,
      };
    });
  } catch (error) {
    console.error("Error in listInventoryItems:", error);
    return [];
  }
}

/**
 * Returns summary statistics for inventory dashboard cards:
 * - Inventory Total Value
 * - Low Stock Items Count
 * - Total Unique Items Count
 */
export async function getInventoryStats() {
  try {
    await requireRole(["owner", "admin", "staff"]);
    const restaurantId = await getActiveRestaurantId();

    const items = await db.inventoryItem.findMany({
      where: { restaurantId },
      select: {
        quantity: true,
        unitCost: true,
        minReorderLevel: true,
      },
    });

    let totalValue = 0;
    let lowStockCount = 0;

    for (const item of items) {
      totalValue += item.quantity * item.unitCost;
      if (item.quantity <= item.minReorderLevel) {
        lowStockCount += 1;
      }
    }

    return {
      totalValue: `₹${totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      lowStockCount: lowStockCount.toString(),
      totalItems: items.length,
      foodCostPercentage: "28.4%", // Benchmark indicator
    };
  } catch (error) {
    console.error("Error in getInventoryStats:", error);
    return {
      totalValue: "₹0.00",
      lowStockCount: "0",
      totalItems: 0,
      foodCostPercentage: "0%",
    };
  }
}

/**
 * Creates a new inventory item and logs initial stock movement inside a transaction.
 * Owner and Admin only.
 */
export async function createInventoryItem(data: {
  name: string;
  category: string;
  quantity?: number | string;
  unit?: string;
  unitCost?: number | string;
  minReorderLevel?: number | string;
  supplierId?: string;
}) {
  const ctx = await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const parsed = createInventoryItemSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const { name, category, quantity, unit, unitCost, minReorderLevel, supplierId } = parsed.data;

  // Atomic database transaction: Create item + initial stock movement entry
  const newItem = await db.$transaction(async (tx) => {
    const item = await tx.inventoryItem.create({
      data: {
        restaurantId,
        name,
        category,
        quantity,
        unit,
        unitCost,
        minReorderLevel,
        supplierId: supplierId || null,
      },
    });

    if (quantity > 0) {
      await tx.stockMovement.create({
        data: {
          restaurantId,
          inventoryItemId: item.id,
          quantityChange: quantity,
          type: "OPENING_STOCK",
          reason: "Initial stock registration",
          createdById: ctx.userId,
        },
      });
    }

    return item;
  });

  revalidatePath("/dashboard", "layout");
  return newItem;
}

/**
 * Adjusts stock quantity for an inventory item and logs stock movement atomically.
 * Owner, Admin, and Staff can perform stock adjustments.
 */
export async function adjustStock(data: {
  inventoryItemId: string;
  newQuantity: number;
  type?: MovementType;
  reason?: string;
}) {
  const ctx = await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  const parsed = adjustStockSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const { inventoryItemId, newQuantity, type, reason } = parsed.data;

  // Verify ownership
  const existing = await db.inventoryItem.findFirst({
    where: { id: inventoryItemId, restaurantId },
  });
  if (!existing) throw new Error("Inventory item not found");

  const quantityChange = newQuantity - existing.quantity;

  // Atomic database transaction: Update quantity + log StockMovement
  const updatedItem = await db.$transaction(async (tx) => {
    const item = await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { quantity: newQuantity },
    });

    await tx.stockMovement.create({
      data: {
        restaurantId,
        inventoryItemId,
        quantityChange,
        type: type || "ADJUSTMENT",
        reason: reason || "Manual stock adjustment",
        createdById: ctx.userId,
      },
    });

    return item;
  });

  revalidatePath("/dashboard", "layout");
  return updatedItem;
}

/**
 * Updates an inventory item's details.
 * Owner/Admin only.
 */
export async function updateInventoryItem(
  inventoryItemId: string,
  data: Partial<{
    name: string;
    category: string;
    unit: string;
    unitCost: number;
    minReorderLevel: number;
    supplierId: string;
  }>
) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const existing = await db.inventoryItem.findFirst({
    where: { id: inventoryItemId, restaurantId },
  });
  if (!existing) throw new Error("Inventory item not found");

  const parsed = updateInventoryItemSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const updated = await db.inventoryItem.update({
    where: { id: inventoryItemId },
    data: parsed.data,
  });

  revalidatePath("/dashboard", "layout");
  return updated;
}

/**
 * Deletes an inventory item.
 * Owner/Admin only.
 */
export async function deleteInventoryItem(inventoryItemId: string) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const existing = await db.inventoryItem.findFirst({
    where: { id: inventoryItemId, restaurantId },
  });
  if (!existing) throw new Error("Inventory item not found");

  await db.inventoryItem.delete({
    where: { id: inventoryItemId },
  });

  revalidatePath("/dashboard", "layout");
}

/**
 * Lists stock movements for an inventory item or the active restaurant.
 */
export async function listStockMovements(inventoryItemId?: string) {
  try {
    await requireRole(["owner", "admin", "staff"]);
    const restaurantId = await getActiveRestaurantId();

    return await db.stockMovement.findMany({
      where: {
        restaurantId,
        ...(inventoryItemId ? { inventoryItemId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        inventoryItem: true,
      },
    });
  } catch (error) {
    console.error("Error in listStockMovements:", error);
    return [];
  }
}

/**
 * Generates and returns CSV string data for exporting inventory logs.
 */
export async function exportInventoryCSV() {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  const items = await db.inventoryItem.findMany({
    where: { restaurantId },
    orderBy: { category: "asc" },
  });

  const headers = ["Item Name", "Category", "Quantity On Hand", "Unit", "Unit Cost (INR)", "Total Value (INR)", "Status"];
  const rows = items.map((item) => [
    `"${item.name.replace(/"/g, '""')}"`,
    `"${item.category.replace(/"/g, '""')}"`,
    item.quantity.toString(),
    `"${item.unit}"`,
    item.unitCost.toFixed(2),
    (item.quantity * item.unitCost).toFixed(2),
    item.quantity <= item.minReorderLevel ? "Low" : "Healthy",
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
