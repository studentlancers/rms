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

import { calculateBillTotal } from "@/lib/bill-calculator";

export async function calculateBillTotalAction(
  subtotal: number,
  taxRate: number = 0.05,
  packagingCharge: number = 0,
  serviceCharge: number = 0,
  splittingCharge: number = 0
) {
  return calculateBillTotal(subtotal, taxRate, packagingCharge, serviceCharge, splittingCharge);
}

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
  customerName: z.string().transform((val) => val?.trim() || undefined).optional(),
  customerPhone: z
    .string()
    .transform((val) => val?.trim() || undefined)
    .refine(
      (val) => !val || /^[+0-9\s-]{7,15}$/.test(val),
      "Invalid phone number format"
    )
    .optional(),
  packagingCharge: z.number().min(0, "Packaging charge must be non-negative").default(0),
  serviceCharge: z.number().min(0, "Service charge must be non-negative").default(0),
  splittingCharge: z.number().min(0, "Splitting charge must be non-negative").default(0),
  items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
  taxRate: z.number().min(0).max(1).default(0.05), // 5% default
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Creates a new order. Called by staff on behalf of a dine-in/phone/walk-in customer.
 * Includes duplicate active DINE_IN order protection.
 */
export async function createOrder(data: {
  orderType: OrderType;
  tableId?: string;
  customerName?: string;
  customerPhone?: string;
  packagingCharge?: number;
  serviceCharge?: number;
  splittingCharge?: number;
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

  const {
    orderType,
    tableId,
    customerName,
    customerPhone,
    packagingCharge,
    serviceCharge,
    splittingCharge,
    items,
    taxRate,
  } = parsed.data;

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

    if (orderType === "DINE_IN") {
      const existingActiveOrder = await db.order.findFirst({
        where: {
          restaurantId,
          tableId,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
      });
      if (existingActiveOrder) {
        throw new Error(
          `Table ${table.tableNumber} is already occupied by an active order (#ORD-${existingActiveOrder.id.slice(-4).toUpperCase()})`
        );
      }
    }
  }

  const rawSubtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const calc = calculateBillTotal(
    rawSubtotal,
    taxRate,
    packagingCharge,
    serviceCharge,
    splittingCharge
  );

  return await db.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        restaurantId,
        tableId: tableId ?? null,
        createdByUserId: ctx.userId,
        orderType,
        status: "PENDING",
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        items,
        subtotal: calc.subtotal,
        tax: calc.tax,
        packagingCharge: calc.packagingCharge,
        serviceCharge: calc.serviceCharge,
        splittingCharge: calc.splittingCharge,
        total: calc.total,
      },
    });

    if (tableId && orderType === "DINE_IN") {
      await tx.table.update({
        where: { id: tableId },
        data: { status: "OCCUPIED" },
      });
    }

    revalidatePath("/dashboard", "layout");
    revalidatePath("/staff/tables");
    return order;
  });
}

/**
 * Returns all non-completed orders for the active restaurant.
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
 * Automatically releases table when the last active order on it completes or cancels.
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

  return await db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    if (
      (newStatus === "COMPLETED" || newStatus === "CANCELLED") &&
      order.tableId
    ) {
      const otherActiveOrders = await tx.order.count({
        where: {
          tableId: order.tableId,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          id: { not: orderId },
        },
      });

      if (otherActiveOrders === 0) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: "FREE" },
        });
      }
    }

    revalidatePath("/dashboard", "layout");
    revalidatePath("/staff/tables");
    return updated;
  });
}
