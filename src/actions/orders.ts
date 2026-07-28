"use server";

// src/actions/orders.ts
// Server Actions for order management.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, getRestaurantContext } from "@/lib/require-role";
import type { OrderStatus, OrderType } from "@prisma/client";

// ---------------------------------------------------------------------------
// Valid status transitions
// ---------------------------------------------------------------------------

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED", "OUT_FOR_DELIVERY"],
  SERVED: ["COMPLETED"],
  OUT_FOR_DELIVERY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const orderItemSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  variant: z.string().optional(),
  notes: z.string().optional(),
});

const createOrderSchema = z.object({
  orderType: z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]),
  tableId: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
  taxRate: z.number().min(0).max(1).default(0.05), // 5% default
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Creates a new order. Called by staff on behalf of a dine-in/phone/walk-in customer.
 */
export async function createOrder(data: {
  orderType: OrderType;
  tableId?: string;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    variant?: string;
    notes?: string;
  }>;
  taxRate?: number;
}) {
  const ctx = await requireRole(["owner", "admin", "staff"]);
  const restaurantId = ctx.isSuperAdmin
    ? (() => { throw new Error("Super Admin must select a restaurant"); })()
    : ctx.restaurantId;

  const parsed = createOrderSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { orderType, tableId, items, taxRate } = parsed.data;

  // If DINE_IN, tableId is required.
  if (orderType === "DINE_IN" && !tableId) {
    throw new Error("Table ID is required for dine-in orders");
  }

  // If a table is supplied, verify it belongs to this restaurant.
  if (tableId) {
    const table = await db.table.findFirst({
      where: { id: tableId, restaurantId },
    });
    if (!table) throw new Error("Table not found");
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const tax = parseFloat((subtotal * taxRate).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));

  const order = await db.order.create({
    data: {
      restaurantId,
      tableId: tableId ?? null,
      createdByUserId: ctx.userId,
      orderType,
      status: "PENDING",
      items,
      subtotal,
      tax,
      total,
    },
  });

  // Mark the table as OCCUPIED if it's a dine-in order.
  if (tableId && orderType === "DINE_IN") {
    await db.table.update({
      where: { id: tableId },
      data: { status: "OCCUPIED" },
    });
  }

  revalidatePath("/dashboard", "layout");
  return order;
}

/**
 * Returns all non-completed orders for the active restaurant.
 * Use short-interval polling or SSE on the client to keep this fresh.
 */
export async function listLiveOrders() {
  const ctx = await requireRole(["owner", "admin", "staff"]);
  const restaurantId = ctx.isSuperAdmin
    ? (() => { throw new Error("Super Admin must select a restaurant"); })()
    : ctx.restaurantId;

  return db.order.findMany({
    where: {
      restaurantId,
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
    orderBy: { createdAt: "asc" },
    include: { table: true, delivery: true },
  });
}

/**
 * Returns all orders for the active restaurant, with optional filters.
 */
export async function listOrders(filters?: {
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const ctx = await requireRole(["owner", "admin", "staff"]);
  const restaurantId = ctx.isSuperAdmin
    ? (() => { throw new Error("Super Admin must select a restaurant"); })()
    : ctx.restaurantId;

  return db.order.findMany({
    where: {
      restaurantId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.dateFrom || filters?.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { table: true, delivery: true },
  });
}

/**
 * Updates an order's status, enforcing the allowed transition matrix.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
) {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await (async () => {
    const ctx = await getRestaurantContext();
    if (ctx.isSuperAdmin) throw new Error("Super Admin must select a restaurant");
    return ctx.restaurantId;
  })();

  const order = await db.order.findFirst({
    where: { id: orderId, restaurantId },
  });
  if (!order) throw new Error("Order not found");

  const allowed = ALLOWED_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Cannot transition order from ${order.status} to ${newStatus}`
    );
  }

  const updated = await db.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });

  // If the order is completed or cancelled and it had a table, free the table.
  if (
    (newStatus === "COMPLETED" || newStatus === "CANCELLED") &&
    order.tableId
  ) {
    // Only free the table if there are no other active orders on it.
    const otherActiveOrders = await db.order.count({
      where: {
        tableId: order.tableId,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        id: { not: orderId },
      },
    });
    if (otherActiveOrders === 0) {
      await db.table.update({
        where: { id: order.tableId },
        data: { status: "FREE" },
      });
    }
  }

  revalidatePath("/dashboard", "layout");
  return updated;
}
