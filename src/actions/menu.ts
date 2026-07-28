"use server";

// src/actions/menu.ts
// Server Actions for menu categories and items.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, getActiveRestaurantId } from "@/lib/require-role";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  sortOrder: z.coerce.number().int().default(0),
});

const menuItemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number"),
  isVeg: z.coerce.boolean().default(false),
  isAvailable: z.coerce.boolean().default(true),
  variants: z
    .array(
      z.object({
        name: z.string(),
        priceModifier: z.number(),
      })
    )
    .optional(),
});

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function listCategories() {
  const restaurantId = await getActiveRestaurantId();

  return db.category.findMany({
    where: { restaurantId },
    orderBy: { sortOrder: "asc" },
    include: { menuItems: { where: { isAvailable: true } } },
  });
}

export async function createCategory(formData: FormData) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") ?? 0,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const category = await db.category.create({
    data: { ...parsed.data, restaurantId },
  });

  revalidatePath("/dashboard", "layout");
  return category;
}

export async function updateCategory(
  categoryId: string,
  data: { name?: string; sortOrder?: number }
) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  // Ownership check — category must belong to caller's restaurant.
  const existing = await db.category.findFirst({
    where: { id: categoryId, restaurantId },
  });
  if (!existing) throw new Error("Category not found");

  const updated = await db.category.update({
    where: { id: categoryId },
    data,
  });

  revalidatePath("/dashboard", "layout");
  return updated;
}

export async function deleteCategory(categoryId: string) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const existing = await db.category.findFirst({
    where: { id: categoryId, restaurantId },
  });
  if (!existing) throw new Error("Category not found");

  await db.category.delete({ where: { id: categoryId } });
  revalidatePath("/dashboard", "layout");
}

// ---------------------------------------------------------------------------
// Menu Items
// ---------------------------------------------------------------------------

export async function listMenuItems(categoryId?: string) {
  const restaurantId = await getActiveRestaurantId();

  return db.menuItem.findMany({
    where: {
      restaurantId,
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { name: "asc" },
    include: { category: true },
  });
}

export async function createMenuItem(formData: FormData) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const variantsRaw = formData.get("variants");
  const parsed = menuItemSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    isVeg: formData.get("isVeg"),
    isAvailable: formData.get("isAvailable") ?? true,
    variants: variantsRaw ? JSON.parse(variantsRaw as string) : undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  // Ensure category belongs to same restaurant.
  const category = await db.category.findFirst({
    where: { id: parsed.data.categoryId, restaurantId },
  });
  if (!category) throw new Error("Category not found");

  const item = await db.menuItem.create({
    data: { ...parsed.data, restaurantId },
  });

  revalidatePath("/dashboard", "layout");
  return item;
}

export async function updateMenuItem(
  menuItemId: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    isVeg: boolean;
    isAvailable: boolean;
    categoryId: string;
    variants: Array<{ name: string; priceModifier: number }>;
  }>
) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const existing = await db.menuItem.findFirst({
    where: { id: menuItemId, restaurantId },
  });
  if (!existing) throw new Error("Menu item not found");

  const updated = await db.menuItem.update({
    where: { id: menuItemId },
    data,
  });

  revalidatePath("/dashboard", "layout");
  return updated;
}

export async function toggleMenuItemAvailability(
  menuItemId: string,
  isAvailable: boolean
) {
  // Staff can also toggle availability (e.g. "86 this dish").
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  const existing = await db.menuItem.findFirst({
    where: { id: menuItemId, restaurantId },
  });
  if (!existing) throw new Error("Menu item not found");

  const updated = await db.menuItem.update({
    where: { id: menuItemId },
    data: { isAvailable },
  });

  revalidatePath("/dashboard", "layout");
  return updated;
}

export async function deleteMenuItem(menuItemId: string) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const existing = await db.menuItem.findFirst({
    where: { id: menuItemId, restaurantId },
  });
  if (!existing) throw new Error("Menu item not found");

  await db.menuItem.delete({ where: { id: menuItemId } });
  revalidatePath("/dashboard", "layout");
}
