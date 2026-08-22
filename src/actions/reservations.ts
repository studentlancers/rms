"use server";

// src/actions/reservations.ts
// Server Actions for reservation management with atomic table state transitions.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, getActiveRestaurantId } from "@/lib/require-role";
import type { ReservationStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const createReservationSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(1, "Phone number is required"),
  partySize: z.coerce.number().int().positive("Party size must be at least 1"),
  reservationTime: z.coerce.date(),
  tableId: z.string().optional(),
  notes: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Creates a new reservation (phone/walk-in). All roles.
 * The calling user (staff who took the call) is recorded as takenByUserId.
 */
export async function createReservation(formData: FormData) {
  const ctx = await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  const parsed = createReservationSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    partySize: formData.get("partySize"),
    reservationTime: formData.get("reservationTime"),
    tableId: formData.get("tableId") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { tableId, ...rest } = parsed.data;

  // If a table is provided, validate it belongs to this restaurant.
  if (tableId) {
    const table = await db.table.findFirst({
      where: { id: tableId, restaurantId },
    });
    if (!table) throw new Error("Table not found");
  }

  const reservation = await db.reservation.create({
    data: {
      ...rest,
      restaurantId,
      tableId: tableId ?? null,
      takenByUserId: ctx.userId,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/staff/tables");
  return reservation;
}

/**
 * Lists reservations for the active restaurant.
 * Optionally filter by date (returns reservations on that day).
 */
export async function listReservations(date?: Date) {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  const dayStart = date ? new Date(date.setHours(0, 0, 0, 0)) : undefined;
  const dayEnd = date ? new Date(date.setHours(23, 59, 59, 999)) : undefined;

  return db.reservation.findMany({
    where: {
      restaurantId,
      ...(dayStart && dayEnd
        ? { reservationTime: { gte: dayStart, lte: dayEnd } }
        : {}),
    },
    orderBy: { reservationTime: "asc" },
    include: { table: true },
  });
}

/**
 * Confirms a reservation and assigns a table. Atomically marks table as RESERVED.
 */
export async function confirmReservation(
  reservationId: string,
  tableId: string
) {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  const reservation = await db.reservation.findFirst({
    where: { id: reservationId, restaurantId },
  });
  if (!reservation) throw new Error("Reservation not found");

  const table = await db.table.findFirst({
    where: { id: tableId, restaurantId },
  });
  if (!table) throw new Error("Table not found");

  return await db.$transaction(async (tx) => {
    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "CONFIRMED", tableId },
    });

    await tx.table.update({
      where: { id: tableId },
      data: { status: "RESERVED" },
    });

    revalidatePath("/dashboard", "layout");
    revalidatePath("/staff/tables");
    return updated;
  });
}

/**
 * Updates the status of a reservation atomically with related Table status side-effects.
 * - SEATED -> Table.status = OCCUPIED
 * - CANCELLED / NO_SHOW -> Table.status = FREE
 */
export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus
) {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  const reservation = await db.reservation.findFirst({
    where: { id: reservationId, restaurantId },
  });
  if (!reservation) throw new Error("Reservation not found");

  return await db.$transaction(async (tx) => {
    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: { status },
    });

    if (reservation.tableId) {
      if (status === "SEATED") {
        await tx.table.update({
          where: { id: reservation.tableId },
          data: { status: "OCCUPIED" },
        });
      } else if (status === "CANCELLED" || status === "NO_SHOW") {
        await tx.table.update({
          where: { id: reservation.tableId },
          data: { status: "FREE" },
        });
      }
    }

    revalidatePath("/dashboard", "layout");
    revalidatePath("/staff/tables");
    return updated;
  });
}
