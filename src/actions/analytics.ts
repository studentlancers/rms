"use server";

// src/actions/analytics.ts
// Server Actions for analytics and reporting.
// Owner-only (except platformOverview which is super_admin only).

import { db } from "@/lib/db";
import { requireRole, requireSuperAdmin, getActiveRestaurantId } from "@/lib/require-role";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DateRange {
  from: Date;
  to: Date;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Returns daily sales totals for the active restaurant within a date range.
 * Owner only.
 */
export async function getDailySales(dateRange: DateRange) {
  try {
    await requireRole(["owner"]);
    const restaurantId = await getActiveRestaurantId();

    const orders = await db.order.findMany({
      where: {
        restaurantId,
        status: "COMPLETED",
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      select: {
        createdAt: true,
        subtotal: true,
        tax: true,
        total: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by day.
    const byDay: Record<string, { date: string; subtotal: number; tax: number; total: number; count: number }> = {};

    for (const order of orders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      if (!byDay[day]) {
        byDay[day] = { date: day, subtotal: 0, tax: 0, total: 0, count: 0 };
      }
      byDay[day].subtotal += order.subtotal;
      byDay[day].tax += order.tax;
      byDay[day].total += order.total;
      byDay[day].count += 1;
    }

    return Object.values(byDay);
  } catch (error) {
    console.error("Error in getDailySales action:", error);
    return [];
  }
}

/**
 * Returns the top N selling menu items by quantity in a date range.
 * Owner only.
 */
export async function getTopItems(
  dateRange: DateRange,
  limit: number = 10
) {
  try {
    await requireRole(["owner"]);
    const restaurantId = await getActiveRestaurantId();

    const orders = await db.order.findMany({
      where: {
        restaurantId,
        status: "COMPLETED",
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      select: { items: true },
    });

    // Aggregate item quantities from JSON blobs.
    const itemTotals: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const order of orders) {
      const items = order.items as Array<{
        menuItemId: string;
        name: string;
        quantity: number;
        unitPrice: number;
      }>;
      for (const item of items) {
        if (!itemTotals[item.menuItemId]) {
          itemTotals[item.menuItemId] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        itemTotals[item.menuItemId].quantity += item.quantity;
        itemTotals[item.menuItemId].revenue +=
          item.unitPrice * item.quantity;
      }
    }

    return Object.entries(itemTotals)
      .map(([menuItemId, data]) => ({ menuItemId, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  } catch (error) {
    console.error("Error in getTopItems action:", error);
    return [];
  }
}

/**
 * Returns platform-wide summary for the Super Admin console.
 */
export async function getPlatformOverview() {
  await requireSuperAdmin();

  const orgs = await auth.api.listOrganizations({
    headers: await headers(),
  });

  const totalOrders = await db.order.count();
  const completedOrders = await db.order.count({ where: { status: "COMPLETED" } });

  const revenueAgg = await db.order.aggregate({
    _sum: { total: true },
    where: { status: "COMPLETED" },
  });

  return {
    totalRestaurants: orgs.length,
    totalOrders,
    completedOrders,
    totalRevenue: revenueAgg._sum.total ?? 0,
  };
}
