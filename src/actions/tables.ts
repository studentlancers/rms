"use server";

// src/actions/tables.ts
// Server Actions for table management.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, getActiveRestaurantId } from "@/lib/require-role";
import type { TableStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const tableSchema = z.object({
  tableNumber: z.string().min(1, "Table number is required"),
  capacity: z.coerce.number().int().positive("Capacity must be a positive integer"),
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Returns all tables for the active restaurant with their current status.
 */
export async function listTables() {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  return db.table.findMany({
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
}

/**
 * Creates a new table. Owner/Admin only.
 */
export async function createTable(formData: FormData) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const parsed = tableSchema.safeParse({
    tableNumber: formData.get("tableNumber"),
    capacity: formData.get("capacity"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const table = await db.table.create({
    data: { ...parsed.data, restaurantId },
  });

  revalidatePath("/dashboard", "layout");
  return table;
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
  return updated;
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
}
