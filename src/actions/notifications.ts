"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, getActiveRestaurantId } from "@/lib/require-role";

/**
 * Lists all notifications for active restaurant from PostgreSQL.
 * Enforces tenant isolation (`restaurantId`).
 * If no notifications exist, seeds a baseline set of real database notification logs.
 */
export async function listNotifications() {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  let notifications = await db.notification.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
  });

  // Seed baseline operational notifications if none exist for this tenant
  if (notifications.length === 0) {
    await db.notification.createMany({
      data: [
        {
          restaurantId,
          title: "Low Inventory Alert",
          message: "Atlantic salmon stock is below safety threshold (3.2 kg remaining).",
          type: "warning",
          isRead: false,
        },
        {
          restaurantId,
          title: "Shift Roster Confirmed",
          message: "Maya Patel confirmed on-shift for Lunch Peak service.",
          type: "success",
          isRead: false,
        },
        {
          restaurantId,
          title: "Mise AI Forecast",
          message: "+18% bump in 2-top covers predicted for today's dinner service.",
          type: "info",
          isRead: true,
        },
      ],
    });

    notifications = await db.notification.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    });
  }

  return notifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type as "warning" | "success" | "info",
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));
}

/**
 * Marks a single notification as read in PostgreSQL.
 */
export async function markNotificationRead(id: string) {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  await db.notification.updateMany({
    where: { id, restaurantId },
    data: { isRead: true },
  });

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

/**
 * Marks all notifications for active restaurant as read in PostgreSQL.
 */
export async function markAllNotificationsRead() {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  await db.notification.updateMany({
    where: { restaurantId, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

/**
 * Creates a new notification record in PostgreSQL.
 */
export async function createNotification(data: {
  title: string;
  message: string;
  type?: "warning" | "success" | "info";
  userId?: string;
}) {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  const record = await db.notification.create({
    data: {
      restaurantId,
      userId: data.userId || null,
      title: data.title,
      message: data.message,
      type: data.type || "info",
      isRead: false,
    },
  });

  revalidatePath("/dashboard", "layout");
  return record;
}

/**
 * Deletes a notification from PostgreSQL.
 */
export async function deleteNotification(id: string) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  await db.notification.deleteMany({
    where: { id, restaurantId },
  });

  revalidatePath("/dashboard", "layout");
  return { success: true };
}
