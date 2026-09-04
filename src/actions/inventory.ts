"use server";

// src/actions/inventory.ts
// Server Actions for Inventory Management & Stock Control.
// Scope: Tenant isolated by active restaurantId.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, getActiveRestaurantId } from "@/lib/require-role";
import type { MovementType } from "@prisma/client";

import { trimmedString, optionalTrimmedString, quantitySchema, moneySchema } from "@/lib/validation";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createInventoryItemSchema = z.object({
  name: trimmedString(1, 120, "Item name"),
  category: trimmedString(1, 80, "Category"),
  quantity: quantitySchema("Quantity", 1_000_000).default(0),
  unit: trimmedString(1, 30, "Unit").default("unit"),
  unitCost: moneySchema("Unit cost", 500_000).default(0),
  minReorderLevel: quantitySchema("Reorder level", 100_000).default(10),
  inventoryType: z.enum(["DAILY", "MONTHLY"]).default("DAILY"),
  supplierId: optionalTrimmedString(100, "Supplier ID"),
});

const updateInventoryItemSchema = createInventoryItemSchema.partial();

const adjustStockSchema = z.object({
  inventoryItemId: trimmedString(1, 100, "Inventory Item ID"),
  newQuantity: quantitySchema("Quantity", 1_000_000),
  type: z.enum(["OPENING_STOCK", "PURCHASE", "USAGE", "ADJUSTMENT", "WASTAGE"]).default("ADJUSTMENT"),
  reason: optionalTrimmedString(250, "Reason"),
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
  inventoryType?: "DAILY" | "MONTHLY";
  supplierId?: string;
}) {
  const ctx = await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const parsed = createInventoryItemSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const { name, category, quantity, unit, unitCost, minReorderLevel, inventoryType, supplierId } = parsed.data;

  // Atomic database transaction: Create item + initial stock movement entry + Expense entry
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
        inventoryType: inventoryType || "DAILY",
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

      const totalCost = quantity * unitCost;
      if (totalCost > 0) {
        let supplierName: string | null = null;
        if (item.supplierId) {
          const sup = await tx.supplier.findUnique({ where: { id: item.supplierId } });
          supplierName = sup?.name || null;
        }

        try {
          await tx.expense.create({
            data: {
              restaurantId,
              type: "INVENTORY",
              name,
              productName: name,
              weight: quantity,
              unit,
              amount: totalCost,
              date: new Date(),
              status: "PAID",
              supplierId: item.supplierId || null,
              supplierName,
              inventoryItemId: item.id,
              createdById: ctx.userId,
            },
          });
        } catch {
          // Safe fallback for running server processes with cached Prisma Client schema
          const expId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const now = new Date();
          await tx.$executeRawUnsafe(
            `INSERT INTO "Expense" ("id", "restaurantId", "type", "name", "productName", "weight", "unit", "amount", "date", "status", "supplierId", "supplierName", "inventoryItemId", "createdById", "createdAt", "updatedAt") VALUES ($1, $2, 'INVENTORY'::"ExpenseType", $3, $4, $5, $6, $7, $8, 'PAID'::"ExpenseStatus", $9, $10, $11, $12, $13, $14)`,
            expId, restaurantId, name, name, quantity, unit, totalCost, now, item.supplierId || null, supplierName, item.id, ctx.userId, now, now
          );
        }
      }
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

  // Atomic database transaction: Update quantity + log StockMovement + log Expense if PURCHASE
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

    if (type === "PURCHASE" && quantityChange > 0 && existing.unitCost > 0) {
      const purchaseAmount = quantityChange * existing.unitCost;
      let supplierName: string | null = null;
      if (existing.supplierId) {
        const sup = await tx.supplier.findUnique({ where: { id: existing.supplierId } });
        supplierName = sup?.name || null;
      }

      try {
        await tx.expense.create({
          data: {
            restaurantId,
            type: "INVENTORY",
            name: existing.name,
            productName: existing.name,
            weight: quantityChange,
            unit: existing.unit,
            amount: purchaseAmount,
            date: new Date(),
            status: "PAID",
            supplierId: existing.supplierId || null,
            supplierName,
            inventoryItemId: existing.id,
            createdById: ctx.userId,
          },
        });
      } catch {
        // Safe fallback for running server processes with cached Prisma Client schema
        const expId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const now = new Date();
        await tx.$executeRawUnsafe(
          `INSERT INTO "Expense" ("id", "restaurantId", "type", "name", "productName", "weight", "unit", "amount", "date", "status", "supplierId", "supplierName", "inventoryItemId", "createdById", "createdAt", "updatedAt") VALUES ($1, $2, 'INVENTORY'::"ExpenseType", $3, $4, $5, $6, $7, $8, 'PAID'::"ExpenseStatus", $9, $10, $11, $12, $13, $14)`,
          expId, restaurantId, existing.name, existing.name, quantityChange, existing.unit, purchaseAmount, now, existing.supplierId || null, supplierName, existing.id, ctx.userId, now, now
        );
      }
    }

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
    inventoryType: "DAILY" | "MONTHLY";
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
 * Supports filtering by inventoryItemId and movement type.
 */
export async function listStockMovements(filters?: {
  inventoryItemId?: string;
  type?: string;
  limit?: number;
}) {
  try {
    await requireRole(["owner", "admin", "staff"]);
    const restaurantId = await getActiveRestaurantId();

    const invItemId = typeof filters === "string" ? filters : filters?.inventoryItemId;
    const movType = typeof filters === "object" ? filters?.type : undefined;
    const limit = typeof filters === "object" && filters?.limit ? filters.limit : 100;

    return await db.stockMovement.findMany({
      where: {
        restaurantId,
        ...(invItemId && invItemId !== "ALL" ? { inventoryItemId: invItemId } : {}),
        ...(movType && movType !== "ALL" ? { type: movType as MovementType } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: true,
          },
        },
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

  const headers = ["Item Name", "Category", "Tracking Type", "Quantity On Hand", "Unit", "Unit Cost (INR)", "Total Value (INR)", "Status"];
  const rows = items.map((item) => [
    `"${item.name.replace(/"/g, '""')}"`,
    `"${item.category.replace(/"/g, '""')}"`,
    `"${item.inventoryType}"`,
    item.quantity.toString(),
    `"${item.unit}"`,
    item.unitCost.toFixed(2),
    (item.quantity * item.unitCost).toFixed(2),
    item.quantity <= item.minReorderLevel ? "Low" : "Healthy",
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

// ---------------------------------------------------------------------------
// Phase 2: Daily & Monthly Inventory Ledger Actions
// ---------------------------------------------------------------------------

/**
 * Returns daily inventory ledger for a target date (defaults to today).
 * Calculates Opening Stock, Purchases, Usage, Wastage, System Closing Stock, and Physical Closing Stock.
 */
export async function getDailyInventoryLedger(targetDateStr?: string) {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
  const dayStart = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999));

  // Batch query items, today's logs, and today's movements in 1 round-trip
  const [inventoryItems, existingLogs, dayMovements] = await Promise.all([
    db.inventoryItem.findMany({
      where: { restaurantId },
      orderBy: { name: "asc" },
      include: { supplier: true },
    }),
    db.dailyInventoryLog.findMany({
      where: { restaurantId, date: dayStart },
    }),
    db.stockMovement.findMany({
      where: {
        restaurantId,
        createdAt: { gte: dayStart, lte: dayEnd },
      },
    }),
  ]);

  const logByItem = new Map(existingLogs.map((l) => [l.inventoryItemId, l]));

  // Index movements by inventoryItemId
  const movementsByItem = new Map<string, typeof dayMovements>();
  for (const m of dayMovements) {
    const list = movementsByItem.get(m.inventoryItemId) || [];
    list.push(m);
    movementsByItem.set(m.inventoryItemId, list);
  }

  // Find missing items that have no log today to resolve previous day's closing stock
  const missingItems = inventoryItems.filter((item) => !logByItem.has(item.id));
  const prevLogsByItem = new Map<string, any>();
  if (missingItems.length > 0) {
    const prevLogs = await db.dailyInventoryLog.findMany({
      where: {
        restaurantId,
        inventoryItemId: { in: missingItems.map((i) => i.id) },
        date: { lt: dayStart },
      },
      orderBy: { date: "desc" },
    });
    for (const pl of prevLogs) {
      if (!prevLogsByItem.has(pl.inventoryItemId)) {
        prevLogsByItem.set(pl.inventoryItemId, pl);
      }
    }
  }

  const logs: Array<{
    inventoryItemId: string;
    name: string;
    category: string;
    unit: string;
    inventoryType: "DAILY" | "MONTHLY";
    openingStock: number;
    purchases: number;
    usage: number;
    wastage: number;
    systemClosing: number;
    closingStock: number;
    isClosed: boolean;
    closedAt?: string;
    status: "Healthy" | "Low";
  }> = [];

  let totalOpening = 0;
  let totalPurchases = 0;
  let totalUsage = 0;
  let totalWastage = 0;
  let totalClosing = 0;

  for (const item of inventoryItems) {
    const log = logByItem.get(item.id);
    let openingStock = 0;

    if (log) {
      openingStock = log.openingStock;
    } else {
      const prevLog = prevLogsByItem.get(item.id);
      openingStock = prevLog ? prevLog.closingStock : item.quantity;
    }

    const itemMovements = movementsByItem.get(item.id) || [];
    let dayPurchases = 0;
    let dayUsage = 0;
    let dayWastage = 0;
    let dayAdjustments = 0;

    for (const m of itemMovements) {
      if (m.type === "PURCHASE") {
        dayPurchases += m.quantityChange;
      } else if (m.type === "USAGE") {
        dayUsage += Math.abs(m.quantityChange);
      } else if (m.type === "WASTAGE") {
        dayWastage += Math.abs(m.quantityChange);
      } else if (m.type === "ADJUSTMENT") {
        dayAdjustments += m.quantityChange;
      }
    }

    const systemClosing = Math.max(
      0,
      openingStock + dayPurchases - dayUsage - dayWastage + dayAdjustments
    );
    const isClosed = log?.isClosed || false;
    const closingStock = isClosed ? (log?.closingStock ?? systemClosing) : systemClosing;

    totalOpening += openingStock;
    totalPurchases += dayPurchases;
    totalUsage += dayUsage;
    totalWastage += dayWastage;
    totalClosing += closingStock;

    logs.push({
      inventoryItemId: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      inventoryType: item.inventoryType as "DAILY" | "MONTHLY",
      openingStock,
      purchases: dayPurchases,
      usage: dayUsage,
      wastage: dayWastage,
      systemClosing,
      closingStock,
      isClosed,
      closedAt: log?.closedAt ? log.closedAt.toISOString() : undefined,
      status: closingStock <= item.minReorderLevel ? "Low" : "Healthy",
    });
  }

  return {
    date: dayStart.toISOString(),
    items: logs,
    totals: {
      totalOpening,
      totalPurchases,
      totalUsage,
      totalWastage,
      totalClosing,
    },
  };
}

/**
 * Closes today's (or target date's) daily inventory.
 * Compares physical count against system closing stock, records ADJUSTMENT movement if different,
 * and sets `isClosed = true` with final closing stock balance.
 */
export async function closeDayInventory(data: {
  dateStr?: string;
  items: Array<{ inventoryItemId: string; actualPhysicalStock: number }>;
}) {
  const ctx = await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const targetDate = data.dateStr ? new Date(data.dateStr) : new Date();
  const dayStart = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999));

  return await db.$transaction(async (tx) => {
    for (const inputItem of data.items) {
      const invItem = await tx.inventoryItem.findFirst({
        where: { id: inputItem.inventoryItemId, restaurantId },
      });
      if (!invItem) continue;

      const log = await tx.dailyInventoryLog.findFirst({
        where: { restaurantId, inventoryItemId: invItem.id, date: dayStart },
      });

      const openingStock = log ? log.openingStock : invItem.quantity;

      const dayMovements = await tx.stockMovement.findMany({
        where: {
          restaurantId,
          inventoryItemId: invItem.id,
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      let dayPurchases = 0;
      let dayUsage = 0;
      let dayWastage = 0;
      let dayAdjustments = 0;

      for (const m of dayMovements) {
        if (m.type === "PURCHASE") dayPurchases += m.quantityChange;
        else if (m.type === "USAGE") dayUsage += Math.abs(m.quantityChange);
        else if (m.type === "WASTAGE") dayWastage += Math.abs(m.quantityChange);
        else if (m.type === "ADJUSTMENT") dayAdjustments += m.quantityChange;
      }

      const systemClosing = Math.max(0, openingStock + dayPurchases - dayUsage - dayWastage + dayAdjustments);
      const actualPhysical = Math.max(0, inputItem.actualPhysicalStock);
      const difference = actualPhysical - systemClosing;

      if (Math.abs(difference) > 0.0001) {
        await tx.stockMovement.create({
          data: {
            restaurantId,
            inventoryItemId: invItem.id,
            quantityChange: difference,
            type: "ADJUSTMENT",
            reason: `Daily closing physical stock adjustment (${actualPhysical} actual vs ${systemClosing.toFixed(2)} system)`,
            createdById: ctx.userId,
          },
        });

        await tx.inventoryItem.update({
          where: { id: invItem.id },
          data: { quantity: actualPhysical },
        });
      }

      if (log) {
        await tx.dailyInventoryLog.update({
          where: { id: log.id },
          data: {
            purchases: dayPurchases,
            usage: dayUsage,
            wastage: dayWastage,
            closingStock: actualPhysical,
            isClosed: true,
            closedAt: new Date(),
            closedById: ctx.userId,
          },
        });
      } else {
        await tx.dailyInventoryLog.create({
          data: {
            restaurantId,
            inventoryItemId: invItem.id,
            date: dayStart,
            openingStock,
            purchases: dayPurchases,
            usage: dayUsage,
            wastage: dayWastage,
            closingStock: actualPhysical,
            isClosed: true,
            closedAt: new Date(),
            closedById: ctx.userId,
          },
        });
      }
    }

    revalidatePath("/dashboard", "layout");
    revalidatePath("/staff/inventory");
    return { success: true };
  });
}

/**
 * Records stock wastage for an inventory item.
 * Updates quantity, logs WASTAGE StockMovement, and revalidates paths.
 */
export async function recordWastage(data: {
  inventoryItemId: string;
  quantity: number;
  reason?: string;
}) {
  const ctx = await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  const existing = await db.inventoryItem.findFirst({
    where: { id: data.inventoryItemId, restaurantId },
  });
  if (!existing) throw new Error("Inventory item not found");

  const wastageQty = Math.abs(data.quantity);
  if (wastageQty <= 0) throw new Error("Wastage quantity must be positive");

  const updated = await db.$transaction(async (tx) => {
    const newQty = Math.max(0, existing.quantity - wastageQty);
    const item = await tx.inventoryItem.update({
      where: { id: existing.id },
      data: { quantity: newQty },
    });

    await tx.stockMovement.create({
      data: {
        restaurantId,
        inventoryItemId: existing.id,
        quantityChange: -wastageQty,
        type: "WASTAGE",
        reason: data.reason || "Manual wastage record",
        createdById: ctx.userId,
      },
    });

    return item;
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/staff/inventory");
  return updated;
}

/**
 * Returns monthly inventory ledger for a target year & month.
 * Aggregates month opening, total monthly purchases, usage, wastage, and month-end closing stock.
 */
export async function getMonthlyInventoryLedger(year?: number, month?: number) {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month !== undefined ? month : now.getMonth();

  const monthStart = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999));

  const [inventoryItems, monthLogs, monthMovements, prevLogs] = await Promise.all([
    db.inventoryItem.findMany({
      where: { restaurantId },
      orderBy: { name: "asc" },
    }),
    db.dailyInventoryLog.findMany({
      where: {
        restaurantId,
        date: { gte: monthStart, lte: monthEnd },
      },
      orderBy: { date: "asc" },
    }),
    db.stockMovement.findMany({
      where: {
        restaurantId,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    db.dailyInventoryLog.findMany({
      where: {
        restaurantId,
        date: { lt: monthStart },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  // Index movements by item
  const movementsByItem = new Map<string, typeof monthMovements>();
  for (const m of monthMovements) {
    const list = movementsByItem.get(m.inventoryItemId) || [];
    list.push(m);
    movementsByItem.set(m.inventoryItemId, list);
  }

  // Index month logs by item
  const logsByItem = new Map<string, typeof monthLogs>();
  for (const l of monthLogs) {
    const list = logsByItem.get(l.inventoryItemId) || [];
    list.push(l);
    logsByItem.set(l.inventoryItemId, list);
  }

  // Index previous logs before monthStart by item
  const prevLogByItem = new Map<string, any>();
  for (const pl of prevLogs) {
    if (!prevLogByItem.has(pl.inventoryItemId)) {
      prevLogByItem.set(pl.inventoryItemId, pl);
    }
  }

  const logs: Array<{
    inventoryItemId: string;
    name: string;
    category: string;
    unit: string;
    inventoryType: "DAILY" | "MONTHLY";
    openingStock: number;
    purchases: number;
    usage: number;
    wastage: number;
    closingStock: number;
  }> = [];

  let totalOpening = 0;
  let totalPurchases = 0;
  let totalUsage = 0;
  let totalWastage = 0;
  let totalClosing = 0;

  for (const item of inventoryItems) {
    const prevLog = prevLogByItem.get(item.id);
    const itemMonthLogs = logsByItem.get(item.id) || [];
    const firstLogInMonth = itemMonthLogs[0];

    const monthOpening = prevLog
      ? prevLog.closingStock
      : firstLogInMonth
      ? firstLogInMonth.openingStock
      : item.quantity;

    const itemMovements = movementsByItem.get(item.id) || [];
    let monthPurchases = 0;
    let monthUsage = 0;
    let monthWastage = 0;
    let monthAdjustments = 0;

    for (const m of itemMovements) {
      if (m.type === "PURCHASE") monthPurchases += m.quantityChange;
      else if (m.type === "USAGE") monthUsage += Math.abs(m.quantityChange);
      else if (m.type === "WASTAGE") monthWastage += Math.abs(m.quantityChange);
      else if (m.type === "ADJUSTMENT") monthAdjustments += m.quantityChange;
    }

    const closedLogs = itemMonthLogs.filter((l) => l.isClosed);
    const lastClosedLogInMonth = closedLogs.length > 0 ? closedLogs[closedLogs.length - 1] : null;

    const monthClosing = lastClosedLogInMonth
      ? lastClosedLogInMonth.closingStock
      : Math.max(0, monthOpening + monthPurchases - monthUsage - monthWastage + monthAdjustments);

    totalOpening += monthOpening;
    totalPurchases += monthPurchases;
    totalUsage += monthUsage;
    totalWastage += monthWastage;
    totalClosing += monthClosing;

    logs.push({
      inventoryItemId: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      inventoryType: item.inventoryType as "DAILY" | "MONTHLY",
      openingStock: monthOpening,
      purchases: monthPurchases,
      usage: monthUsage,
      wastage: monthWastage,
      closingStock: monthClosing,
    });
  }

  return {
    year: targetYear,
    month: targetMonth,
    items: logs,
    totals: {
      totalOpening,
      totalPurchases,
      totalUsage,
      totalWastage,
      totalClosing,
    },
  };
}
