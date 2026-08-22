"use server";

// src/actions/delivery.ts
// Server Actions for delivery management.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, getRestaurantContext, getActiveRestaurantId } from "@/lib/require-role";
import type { DeliveryStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Valid delivery status transitions
// ---------------------------------------------------------------------------

const ALLOWED_DELIVERY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> =
  {
    ASSIGNED: ["IN_TRANSIT"],
    IN_TRANSIT: ["NEARBY", "DELIVERED"],
    NEARBY: ["DELIVERED"],
    DELIVERED: [],
  };

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Assigns a rider to a delivery order. Owner/Admin only.
 */
export async function assignDelivery(orderId: string, riderUserId: string) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  // Verify order belongs to this restaurant and is a DELIVERY type.
  const order = await db.order.findFirst({
    where: { id: orderId, restaurantId, orderType: "DELIVERY" },
    include: { delivery: true },
  });
  if (!order) throw new Error("Delivery order not found");

  if (order.delivery) throw new Error("Delivery already assigned");

  const delivery = await db.delivery.create({
    data: {
      restaurantId,
      orderId,
      riderUserId,
      status: "ASSIGNED",
    },
  });

  // Advance order status to OUT_FOR_DELIVERY.
  await db.order.update({
    where: { id: orderId },
    data: { status: "OUT_FOR_DELIVERY" },
  });

  revalidatePath("/dashboard", "layout");
  return delivery;
}

/**
 * Updates delivery status. Owner/Admin/Staff (riders) can update.
 */
export async function updateDeliveryStatus(
  deliveryId: string,
  newStatus: DeliveryStatus,
  etaMinutes?: number
) {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  const delivery = await db.delivery.findFirst({
    where: { id: deliveryId, restaurantId },
  });
  if (!delivery) throw new Error("Delivery not found");

  const allowed = ALLOWED_DELIVERY_TRANSITIONS[delivery.status];
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Cannot transition delivery from ${delivery.status} to ${newStatus}`
    );
  }

  const updated = await db.delivery.update({
    where: { id: deliveryId },
    data: {
      status: newStatus,
      ...(etaMinutes !== undefined ? { etaMinutes } : {}),
      ...(newStatus === "DELIVERED" ? { deliveredAt: new Date() } : {}),
    },
  });

  // If delivered, mark the order as COMPLETED.
  if (newStatus === "DELIVERED") {
    await db.order.update({
      where: { id: delivery.orderId },
      data: { status: "COMPLETED" },
    });
  }

  revalidatePath("/dashboard", "layout");
  return updated;
}

/**
 * Returns all active (non-delivered) deliveries for the active restaurant.
 */
export async function listActiveDeliveries() {
  try {
    await requireRole(["owner", "admin", "staff"]);
    const restaurantId = await getActiveRestaurantId();

    return await db.delivery.findMany({
      where: {
        restaurantId,
        status: { not: "DELIVERED" },
      },
      orderBy: { createdAt: "asc" },
      include: { order: true },
    });
  } catch (error) {
    console.error("Error in listActiveDeliveries action:", error);
    return [];
  }
}
