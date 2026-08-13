"use server";

// src/actions/tables.ts
// Server Actions for table management.
// Tenant isolated by active restaurantId.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, getActiveRestaurantId } from "@/lib/require-role";
import type { TableStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const tableSchema = z.object({
  tableNumber: z.string().min(1, "Table number is required"),
  capacity: z.coerce.number().int().positive("Capacity must be a positive integer"),
});

const updateTableSchema = z.object({
  tableNumber: z.string().min(1, "Table number cannot be empty").optional(),
  capacity: z.coerce.number().int().positive("Capacity must be a positive integer").optional(),
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Returns all tables for the active restaurant with their current status.
 */
export async function listTables() {
  try {
    await requireRole(["owner", "admin", "staff"]);
    const restaurantId = await getActiveRestaurantId();

    return await db.table.findMany({
      where: { restaurantId },
      orderBy: { tableNumber: "asc" },
      include: {
        orders: {
          where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
          take: 1,
        },
        reservations: {
          where: { status: { in: ["CONFIRMED", "PENDING"] } },
          take: 1,
        },
      },
    });
  } catch (error) {
    console.error("Error in listTables action:", error);
    return [];
  }
}

/**
 * Creates a new table. Owner/Admin only.
 */
export async function createTable(formData: FormData) {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  const parsed = tableSchema.safeParse({
    tableNumber: formData.get("tableNumber"),
    capacity: formData.get("capacity"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  // Check duplicate table number within restaurant
  const existingNumber = await db.table.findFirst({
    where: { restaurantId, tableNumber: parsed.data.tableNumber },
  });
  if (existingNumber) {
    throw new Error(`Table number '${parsed.data.tableNumber}' already exists`);
  }

  const table = await db.table.create({
    data: { ...parsed.data, restaurantId },
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/staff/tables");
  return table;
}

/**
 * Updates an existing table's details (number, capacity). Owner/Admin only.
 */
export async function updateTable(
  tableId: string,
  data: { tableNumber?: string; capacity?: number }
) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const parsed = updateTableSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const existing = await db.table.findFirst({
    where: { id: tableId, restaurantId },
  });
  if (!existing) throw new Error("Table not found");

  if (parsed.data.tableNumber && parsed.data.tableNumber !== existing.tableNumber) {
    const duplicate = await db.table.findFirst({
      where: {
        restaurantId,
        tableNumber: parsed.data.tableNumber,
        id: { not: tableId },
      },
    });
    if (duplicate) {
      throw new Error(`Table number '${parsed.data.tableNumber}' is already in use`);
    }
  }

  const updated = await db.table.update({
    where: { id: tableId },
    data: parsed.data,
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/staff/tables");
  return updated;
}

/**
 * Updates a table's status manually. All roles can do this.
 */
export async function updateTableStatus(
  tableId: string,
  status: TableStatus
) {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  const existing = await db.table.findFirst({
    where: { id: tableId, restaurantId },
  });
  if (!existing) throw new Error("Table not found");

  const updated = await db.table.update({
    where: { id: tableId },
    data: { status },
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/staff/tables");
  return updated;
}

/**
 * Atomic Table Transfer / Move Table. All staff roles.
 * Moves active orders and updates table statuses in a single atomic transaction.
 */
export async function transferTable(
  sourceTableId: string,
  targetTableId: string
) {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  const sourceTable = await db.table.findFirst({
    where: { id: sourceTableId, restaurantId },
  });
  if (!sourceTable) throw new Error("Source table not found");

  const targetTable = await db.table.findFirst({
    where: { id: targetTableId, restaurantId },
  });
  if (!targetTable) throw new Error("Target table not found");

  if (targetTable.status !== "FREE") {
    throw new Error(`Target Table ${targetTable.tableNumber} is not free for transfer`);
  }

  return await db.$transaction(async (tx) => {
    // 1. Reassign any active orders on source table to target table
    await tx.order.updateMany({
      where: {
        restaurantId,
        tableId: sourceTableId,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      data: { tableId: targetTableId },
    });

    // 2. Reassign any active reservations on source table to target table
    await tx.reservation.updateMany({
      where: {
        restaurantId,
        tableId: sourceTableId,
        status: { in: ["CONFIRMED", "SEATED"] },
      },
      data: { tableId: targetTableId },
    });

    // 3. Update source table status to FREE
    await tx.table.update({
      where: { id: sourceTableId },
      data: { status: "FREE" },
    });

    // 4. Update target table status to OCCUPIED
    const updatedTarget = await tx.table.update({
      where: { id: targetTableId },
      data: { status: "OCCUPIED" },
    });

    revalidatePath("/dashboard", "layout");
    revalidatePath("/staff/tables");
    return updatedTarget;
  });
}

/**
 * Deletes a table. Owner only.
 */
export async function deleteTable(tableId: string) {
  await requireRole(["owner"]);
  const restaurantId = await getActiveRestaurantId();

  const existing = await db.table.findFirst({
    where: { id: tableId, restaurantId },
  });
  if (!existing) throw new Error("Table not found");

  await db.table.delete({ where: { id: tableId } });
  revalidatePath("/dashboard", "layout");
  revalidatePath("/staff/tables");
}
