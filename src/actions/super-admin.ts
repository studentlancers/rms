"use server";

// src/actions/super-admin.ts
// Platform-level Server Actions for Super Admin.
// Protected by requireSuperAdmin() to enforce platform access control.

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/require-role";

/**
 * Returns real platform-wide overview statistics for Super Admin dashboard.
 */
export async function getSuperAdminMetrics() {
  await requireSuperAdmin();

  const [
    totalOrgs,
    activeOrgs,
    totalUsers,
    members,
    totalOrders,
    paidOrdersAgg,
    recentOrgs,
    recentUsers,
    recentOrders,
  ] = await Promise.all([
    db.organization.count(),
    db.organization.count({ where: { isActive: true } }),
    db.user.count(),
    db.member.findMany({ select: { role: true } }),
    db.order.count(),
    db.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: "PAID" },
    }),
    db.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        members: {
          where: { role: "owner" },
          include: { user: { select: { name: true, email: true } } },
          take: 1,
        },
      },
    }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        total: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        restaurantId: true,
      },
    }),
  ]);

  const totalOwners = members.filter((m) => m.role === "owner").length;
  const totalAdmins = members.filter((m) => m.role === "admin").length;
  const totalStaff = members.filter((m) => m.role === "staff").length;
  const platformRevenue = paidOrdersAgg._sum.total || 0;

  return {
    totalOrganizations: totalOrgs,
    activeOrganizations: activeOrgs,
    inactiveOrganizations: totalOrgs - activeOrgs,
    totalUsers,
    totalOwners,
    totalAdmins,
    totalStaff,
    totalOrders,
    platformRevenue,
    recentOrganizations: recentOrgs.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      isActive: o.isActive,
      createdAt: o.createdAt,
      ownerName: o.members[0]?.user?.name || "N/A",
      ownerEmail: o.members[0]?.user?.email || "N/A",
    })),
    recentUsers,
    recentOrders,
  };
}

/**
 * Returns all organizations on the platform with search & detailed metrics.
 */
export async function listSuperAdminOrganizations(search?: string) {
  await requireSuperAdmin();

  const query = search?.trim().toLowerCase();

  const orgs = await db.organization.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const orgIds = orgs.map((o) => o.id);

  // Fetch orders stats for all organizations
  const orderStats = await db.order.groupBy({
    by: ["restaurantId"],
    _count: { id: true },
    _sum: { total: true },
    where: { restaurantId: { in: orgIds } },
  });

  const orderStatsMap = new Map<string, { count: number; revenue: number }>();
  for (const stat of orderStats) {
    orderStatsMap.set(stat.restaurantId, {
      count: stat._count.id,
      revenue: stat._sum.total || 0,
    });
  }

  return orgs.map((org) => {
    const ownerMember = org.members.find((m) => m.role === "owner");
    const adminCount = org.members.filter((m) => m.role === "admin").length;
    const staffCount = org.members.filter((m) => m.role === "staff").length;
    const stats = orderStatsMap.get(org.id) || { count: 0, revenue: 0 };

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
      isActive: org.isActive,
      createdAt: org.createdAt,
      owner: ownerMember?.user
        ? { name: ownerMember.user.name, email: ownerMember.user.email }
        : null,
      totalMembers: org.members.length,
      adminCount,
      staffCount,
      totalOrders: stats.count,
      totalRevenue: stats.revenue,
    };
  });
}

/**
 * Activates or deactivates an organization.
 */
export async function toggleOrganizationStatus(
  organizationId: string,
  isActive: boolean
) {
  await requireSuperAdmin();

  const org = await db.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org) throw new Error("Organization not found");

  const updated = await db.organization.update({
    where: { id: organizationId },
    data: { isActive },
  });

  revalidatePath("/super-admin", "layout");
  return updated;
}

/**
 * Returns all platform users with search and organization membership mapping.
 */
export async function listSuperAdminUsers(search?: string) {
  await requireSuperAdmin();

  const query = search?.trim().toLowerCase();

  const users = await db.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      banReason: true,
      createdAt: true,
      members: {
        include: {
          organization: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    platformRole: u.role || "user",
    banned: u.banned ?? false,
    createdAt: u.createdAt,
    memberships: u.members.map((m) => ({
      role: m.role,
      organizationName: m.organization.name,
      organizationSlug: m.organization.slug,
    })),
  }));
}

/**
 * Returns platform analytics and reports for Super Admin.
 */
export async function getSuperAdminReports() {
  await requireSuperAdmin();

  const [totalOrders, paidOrdersAgg, orgs, orderStats] = await Promise.all([
    db.order.count(),
    db.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: "PAID" },
    }),
    db.organization.findMany({
      select: { id: true, name: true, slug: true, isActive: true },
    }),
    db.order.groupBy({
      by: ["restaurantId"],
      _count: { id: true },
      _sum: { total: true },
    }),
  ]);

  const totalRevenue = paidOrdersAgg._sum.total || 0;

  const orgMap = new Map(orgs.map((o) => [o.id, o]));

  const orgReports = orderStats.map((stat) => {
    const org = orgMap.get(stat.restaurantId);
    return {
      restaurantId: stat.restaurantId,
      name: org?.name || "Unknown Restaurant",
      slug: org?.slug || "",
      isActive: org?.isActive ?? true,
      orderCount: stat._count.id,
      revenue: stat._sum.total || 0,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  return {
    totalRevenue,
    totalOrders,
    totalOrganizations: orgs.length,
    activeOrganizations: orgs.filter((o) => o.isActive).length,
    organizationReports: orgReports,
  };
}

// ---------------------------------------------------------------------------
// Super Admin Restaurant Inspection Actions (READ-ONLY Scoped Queries)
// ---------------------------------------------------------------------------

/**
 * Returns comprehensive overview data for a specific restaurant by organizationId.
 * Super Admin platform access required.
 */
export async function getSuperAdminRestaurantOverview(organizationId: string) {
  await requireSuperAdmin();

  const org = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, createdAt: true } },
        },
      },
    },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  const [
    totalOrders,
    todayOrders,
    completedOrders,
    activeOrders,
    cancelledOrders,
    paidOrdersAgg,
    todayPaidAgg,
    monthPaidAgg,
    totalCategories,
    totalMenuItems,
    availableItems,
    soldOutItems,
    vegItems,
    nonVegItems,
    totalSpecials,
    totalTables,
    freeTables,
    occupiedTables,
    reservedTables,
    totalReservations,
    todayReservations,
    pendingReservations,
    confirmedReservations,
    seatedReservations,
    cancelledReservations,
    inventoryItems,
    suppliersCount,
    expensesList,
    activeDeliveries,
    completedDeliveries,
    recentOrders,
    recentReservations,
    recentExpenses,
    recentStockMovements,
    recentDeliveries,
  ] = await Promise.all([
    db.order.count({ where: { restaurantId: organizationId } }),
    db.order.count({ where: { restaurantId: organizationId, createdAt: { gte: todayStart } } }),
    db.order.count({ where: { restaurantId: organizationId, status: "COMPLETED" } }),
    db.order.count({
      where: {
        restaurantId: organizationId,
        status: { in: ["PENDING", "PREPARING", "READY", "SERVED", "OUT_FOR_DELIVERY"] },
      },
    }),
    db.order.count({ where: { restaurantId: organizationId, status: "CANCELLED" } }),
    db.order.aggregate({
      _sum: { total: true },
      where: { restaurantId: organizationId, paymentStatus: "PAID" },
    }),
    db.order.aggregate({
      _sum: { total: true },
      where: { restaurantId: organizationId, paymentStatus: "PAID", createdAt: { gte: todayStart } },
    }),
    db.order.aggregate({
      _sum: { total: true },
      where: { restaurantId: organizationId, paymentStatus: "PAID", createdAt: { gte: monthStart } },
    }),
    db.category.count({ where: { restaurantId: organizationId } }),
    db.menuItem.count({ where: { restaurantId: organizationId } }),
    db.menuItem.count({ where: { restaurantId: organizationId, isAvailable: true } }),
    db.menuItem.count({ where: { restaurantId: organizationId, isAvailable: false } }),
    db.menuItem.count({ where: { restaurantId: organizationId, isVeg: true } }),
    db.menuItem.count({ where: { restaurantId: organizationId, isVeg: false } }),
    db.dailySpecial.count({ where: { restaurantId: organizationId, isAvailable: true } }),
    db.table.count({ where: { restaurantId: organizationId } }),
    db.table.count({ where: { restaurantId: organizationId, status: "FREE" } }),
    db.table.count({ where: { restaurantId: organizationId, status: "OCCUPIED" } }),
    db.table.count({ where: { restaurantId: organizationId, status: "RESERVED" } }),
    db.reservation.count({ where: { restaurantId: organizationId } }),
    db.reservation.count({ where: { restaurantId: organizationId, reservationTime: { gte: todayStart } } }),
    db.reservation.count({ where: { restaurantId: organizationId, status: "PENDING" } }),
    db.reservation.count({ where: { restaurantId: organizationId, status: "CONFIRMED" } }),
    db.reservation.count({ where: { restaurantId: organizationId, status: "SEATED" } }),
    db.reservation.count({ where: { restaurantId: organizationId, status: "CANCELLED" } }),
    db.inventoryItem.findMany({
      where: { restaurantId: organizationId },
      select: { quantity: true, minReorderLevel: true },
    }),
    db.supplier.count({ where: { restaurantId: organizationId } }),
    db.expense.findMany({
      where: { restaurantId: organizationId },
      select: { type: true, amount: true },
    }),
    db.delivery.count({ where: { restaurantId: organizationId, status: { not: "DELIVERED" } } }),
    db.delivery.count({ where: { restaurantId: organizationId, status: "DELIVERED" } }),
    db.order.findMany({
      where: { restaurantId: organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { table: true },
    }),
    db.reservation.findMany({
      where: { restaurantId: organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { table: true },
    }),
    db.expense.findMany({
      where: { restaurantId: organizationId },
      orderBy: { date: "desc" },
      take: 5,
      include: {
        staffUser: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    }),
    db.stockMovement.findMany({
      where: { restaurantId: organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { inventoryItem: true },
    }),
    db.delivery.findMany({
      where: { restaurantId: organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { order: true },
    }),
  ]);

  const ownerMember = org.members.find((m) => m.role === "owner");
  const adminCount = org.members.filter((m) => m.role === "admin").length;
  const staffCount = org.members.filter((m) => m.role === "staff").length;

  const totalRevenue = paidOrdersAgg._sum.total || 0;
  const todayRevenue = todayPaidAgg._sum.total || 0;
  const monthRevenue = monthPaidAgg._sum.total || 0;
  const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

  const lowStockCount = inventoryItems.filter((i) => i.quantity <= i.minReorderLevel).length;

  let totalExpenses = 0;
  let generalExpenses = 0;
  let inventoryExpenses = 0;

  for (const exp of expensesList) {
    const amt = Number(exp.amount || 0);
    totalExpenses += amt;
    if (exp.type === "INVENTORY") {
      inventoryExpenses += amt;
    } else {
      generalExpenses += amt;
    }
  }

  return {
    profile: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
      createdAt: org.createdAt,
      isActive: org.isActive,
      ownerName: ownerMember?.user?.name || "N/A",
      ownerEmail: ownerMember?.user?.email || "N/A",
      totalMembers: org.members.length,
      adminCount,
      staffCount,
    },
    performance: {
      totalRevenue,
      todayRevenue,
      monthRevenue,
      totalOrders,
      todayOrders,
      completedOrders,
      activeOrders,
      cancelledOrders,
      avgOrderValue,
    },
    menuStats: {
      totalCategories,
      totalMenuItems,
      availableItems,
      soldOutItems,
      vegItems,
      nonVegItems,
      totalSpecials,
    },
    tablesStats: {
      totalTables,
      freeTables,
      occupiedTables,
      reservedTables,
    },
    reservationStats: {
      totalReservations,
      todayReservations,
      pendingReservations,
      confirmedReservations,
      seatedReservations,
      cancelledReservations,
    },
    inventoryStats: {
      totalItems: inventoryItems.length,
      lowStockCount,
      suppliersCount,
    },
    expenseStats: {
      totalExpenses,
      generalExpenses,
      inventoryExpenses,
    },
    deliveryStats: {
      activeDeliveries,
      completedDeliveries,
    },
    recentActivity: {
      recentOrders,
      recentReservations,
      recentExpenses,
      recentStockMovements,
      recentDeliveries,
    },
  };
}

/**
 * Returns paginated orders list for a specific restaurant.
 */
export async function getSuperAdminRestaurantOrders(
  organizationId: string,
  page = 1,
  statusFilter?: string
) {
  await requireSuperAdmin();

  const org = await db.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("Organization not found");

  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const whereCondition: any = { restaurantId: organizationId };
  if (statusFilter && statusFilter !== "ALL") {
    whereCondition.status = statusFilter;
  }

  const [orders, totalCount] = await Promise.all([
    db.order.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip,
      include: { table: true, delivery: true },
    }),
    db.order.count({ where: whereCondition }),
  ]);

  return {
    orders,
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
  };
}

/**
 * Returns categories and menu items for a specific restaurant.
 */
export async function getSuperAdminRestaurantMenu(organizationId: string) {
  await requireSuperAdmin();

  const org = await db.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("Organization not found");

  const [categories, menuItems, dailySpecials] = await Promise.all([
    db.category.findMany({
      where: { restaurantId: organizationId },
      orderBy: { sortOrder: "asc" },
      include: { menuItems: true },
    }),
    db.menuItem.findMany({
      where: { restaurantId: organizationId },
      orderBy: { name: "asc" },
      include: { category: true },
    }),
    db.dailySpecial.findMany({
      where: { restaurantId: organizationId, isAvailable: true },
    }),
  ]);

  return {
    categories,
    menuItems,
    dailySpecialsCount: dailySpecials.length,
  };
}

/**
 * Returns tables and reservations for a specific restaurant.
 */
export async function getSuperAdminRestaurantTablesAndReservations(
  organizationId: string
) {
  await requireSuperAdmin();

  const org = await db.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("Organization not found");

  const [tables, reservations] = await Promise.all([
    db.table.findMany({
      where: { restaurantId: organizationId },
      orderBy: { tableNumber: "asc" },
    }),
    db.reservation.findMany({
      where: { restaurantId: organizationId },
      orderBy: { reservationTime: "desc" },
      take: 50,
      include: { table: true },
    }),
  ]);

  const userIds = Array.from(
    new Set(reservations.map((r) => r.takenByUserId).filter(Boolean))
  );

  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u.name || u.email]));

  const enrichedReservations = reservations.map((r) => ({
    ...r,
    takenByName: userMap.get(r.takenByUserId) || "Staff",
  }));

  return {
    tables,
    reservations: enrichedReservations,
  };
}

/**
 * Returns member roster for a specific restaurant.
 */
export async function getSuperAdminRestaurantStaff(organizationId: string) {
  await requireSuperAdmin();

  const org = await db.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("Organization not found");

  const members = await db.member.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      },
    },
  });

  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.user.name || "N/A",
    email: m.user.email,
    role: m.role,
    joinedAt: m.createdAt,
  }));
}

/**
 * Returns deliveries list for a specific restaurant.
 */
export async function getSuperAdminRestaurantDelivery(organizationId: string) {
  await requireSuperAdmin();

  const org = await db.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("Organization not found");

  const deliveries = await db.delivery.findMany({
    where: { restaurantId: organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { order: true },
  });

  const riderUserIds = Array.from(new Set(deliveries.map((d) => d.riderUserId)));
  const riders = await db.user.findMany({
    where: { id: { in: riderUserIds } },
    select: { id: true, name: true, email: true },
  });

  const riderMap = new Map(riders.map((r) => [r.id, r.name || r.email]));

  return deliveries.map((d) => ({
    ...d,
    riderName: riderMap.get(d.riderUserId) || "Rider",
  }));
}

/**
 * Returns inventory items and stock movements for a specific restaurant.
 */
export async function getSuperAdminRestaurantInventory(organizationId: string) {
  await requireSuperAdmin();

  const org = await db.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("Organization not found");

  const [items, movements] = await Promise.all([
    db.inventoryItem.findMany({
      where: { restaurantId: organizationId },
      orderBy: { createdAt: "desc" },
      include: { supplier: true },
    }),
    db.stockMovement.findMany({
      where: { restaurantId: organizationId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { inventoryItem: true },
    }),
  ]);

  return {
    inventoryItems: items,
    stockMovements: movements,
  };
}

/**
 * Returns paginated expenses and expense summary for a specific restaurant.
 */
export async function getSuperAdminRestaurantExpenses(
  organizationId: string,
  page = 1
) {
  await requireSuperAdmin();

  const org = await db.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("Organization not found");

  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const [expenses, totalCount, allExpenses, paidOrdersAgg] = await Promise.all([
    db.expense.findMany({
      where: { restaurantId: organizationId },
      orderBy: { date: "desc" },
      take: pageSize,
      skip,
      include: {
        supplier: true,
        staffUser: { select: { id: true, name: true, email: true } },
      },
    }),
    db.expense.count({ where: { restaurantId: organizationId } }),
    db.expense.findMany({
      where: { restaurantId: organizationId },
      select: { type: true, amount: true },
    }),
    db.order.aggregate({
      _sum: { total: true },
      where: { restaurantId: organizationId, paymentStatus: "PAID" },
    }),
  ]);

  let totalExpenses = 0;
  let generalExpenses = 0;
  let inventoryExpenses = 0;

  for (const exp of allExpenses) {
    const amt = Number(exp.amount || 0);
    totalExpenses += amt;
    if (exp.type === "INVENTORY") {
      inventoryExpenses += amt;
    } else {
      generalExpenses += amt;
    }
  }

  const grossRevenue = paidOrdersAgg._sum.total || 0;
  const netProfit = grossRevenue - totalExpenses;

  return {
    expenses,
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
    summary: {
      grossRevenue,
      totalExpenses,
      generalExpenses,
      inventoryExpenses,
      netProfit,
    },
  };
}

/**
 * Returns daily specials for a specific restaurant.
 */
export async function getSuperAdminRestaurantSpecials(organizationId: string) {
  await requireSuperAdmin();

  const org = await db.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("Organization not found");

  return db.dailySpecial.findMany({
    where: { restaurantId: organizationId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Returns configured billing charge settings for a specific restaurant.
 */
export async function getSuperAdminRestaurantSettings(organizationId: string) {
  await requireSuperAdmin();

  const org = await db.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("Organization not found");

  const settings = await db.restaurantSettings.findUnique({
    where: { restaurantId: organizationId },
  });

  return {
    defaultPackagingCharge: settings?.defaultPackagingCharge ?? 0,
    defaultServiceCharge: settings?.defaultServiceCharge ?? 0,
    defaultSplittingCharge: settings?.defaultSplittingCharge ?? 0,
  };
}

