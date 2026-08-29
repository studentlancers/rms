"use server";

// src/actions/menu.ts
// Server Actions for menu categories and items with Daily Specials synchronization.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, getActiveRestaurantId } from "@/lib/require-role";

import { convertQuantity } from "@/lib/unit-conversion";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  sortOrder: z.coerce.number().int().default(0),
});

const recipeIngredientSchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory item ID is required"),
  quantityRequired: z.coerce.number().positive("Quantity required must be positive"),
  unit: z.string().optional(),
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
  recipe: z.array(recipeIngredientSchema).optional(),
});

// Helper check for special variant
function checkIsSpecialVariant(variants?: any[]): boolean {
  if (!variants || !Array.isArray(variants)) return false;
  return variants.some((v: any) => v && (v.name === "special" || v.isSpecial === true));
}

// Helper to validate recipe items against active tenant's inventory
async function validateRecipeTenantIsolation(
  restaurantId: string,
  recipe?: Array<{ inventoryItemId: string; quantityRequired: number; unit?: string }>
) {
  if (!recipe || recipe.length === 0) return;

  for (const ing of recipe) {
    const invItem = await db.inventoryItem.findFirst({
      where: { id: ing.inventoryItemId, restaurantId },
    });
    if (!invItem) {
      throw new Error("Selected inventory item does not belong to your restaurant or was not found.");
    }
  }
}

// Atomic Sync Helper for DailySpecial
async function syncDailySpecial(
  tx: any,
  restaurantId: string,
  menuItem: { id: string; name: string; categoryId: string; price: number; description: string | null; isAvailable: boolean },
  isSpecial: boolean
) {
  let categoryName = "General";
  try {
    const cat = await tx.category.findUnique({
      where: { id: menuItem.categoryId },
      select: { name: true },
    });
    if (cat?.name) categoryName = cat.name;
  } catch {
    // Ignore category fetch error
  }

  const specialModel = tx.dailySpecial && typeof tx.dailySpecial.findFirst === "function" ? tx.dailySpecial : null;

  if (specialModel) {
    const existing = await specialModel.findFirst({
      where: { restaurantId, menuItemId: menuItem.id },
    });

    if (isSpecial) {
      if (existing) {
        await specialModel.update({
          where: { id: existing.id },
          data: {
            name: menuItem.name,
            category: categoryName,
            regularPrice: menuItem.price,
            description: menuItem.description || menuItem.name,
            isAvailable: menuItem.isAvailable,
          },
        });
      } else {
        await specialModel.create({
          data: {
            restaurantId,
            menuItemId: menuItem.id,
            name: menuItem.name,
            category: categoryName,
            regularPrice: menuItem.price,
            todayPrice: menuItem.price,
            discount: "0% OFF",
            availableQty: "Available",
            chefRecommendation: "Chef Special",
            description: menuItem.description || menuItem.name,
            isAvailable: menuItem.isAvailable,
          },
        });
      }
    } else if (existing) {
      await specialModel.update({
        where: { id: existing.id },
        data: { isAvailable: false },
      });
    }
  } else {
    // Resilient SQL fallback if model delegate is unbound
    const rows: any[] = await tx.$queryRaw`
      SELECT id FROM "DailySpecial" WHERE "restaurantId" = ${restaurantId} AND "menuItemId" = ${menuItem.id} LIMIT 1
    `;
    const existingId = rows && rows.length > 0 ? rows[0].id : null;

    if (isSpecial) {
      if (existingId) {
        await tx.$executeRaw`
          UPDATE "DailySpecial"
          SET "name" = ${menuItem.name},
              "category" = ${categoryName},
              "regularPrice" = ${menuItem.price},
              "description" = ${menuItem.description || menuItem.name},
              "isAvailable" = ${menuItem.isAvailable},
              "updatedAt" = ${new Date()}
          WHERE "id" = ${existingId}
        `;
      } else {
        const spId = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const now = new Date();
        await tx.$executeRaw`
          INSERT INTO "DailySpecial" (
            "id", "restaurantId", "menuItemId", "name", "category", "regularPrice", "todayPrice", "discount", "availableQty", "chefRecommendation", "description", "isAvailable", "date", "createdAt", "updatedAt"
          ) VALUES (
            ${spId}, ${restaurantId}, ${menuItem.id}, ${menuItem.name}, ${categoryName}, ${menuItem.price}, ${menuItem.price}, '0% OFF', 'Available', 'Chef Special', ${menuItem.description || menuItem.name}, ${menuItem.isAvailable}, ${now}, ${now}, ${now}
          )
        `;
      }
    } else if (existingId) {
      await tx.$executeRaw`
        UPDATE "DailySpecial"
        SET "isAvailable" = false, "updatedAt" = ${new Date()}
        WHERE "id" = ${existingId}
      `;
    }
  }
}

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
  revalidatePath("/staff/specials");
  return category;
}

export async function updateCategory(
  categoryId: string,
  data: { name?: string; sortOrder?: number }
) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const existing = await db.category.findFirst({
    where: { id: categoryId, restaurantId },
  });
  if (!existing) throw new Error("Category not found");

  const updated = await db.category.update({
    where: { id: categoryId },
    data,
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/staff/specials");
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
  revalidatePath("/staff/specials");
}

// ---------------------------------------------------------------------------
// Menu Items
// ---------------------------------------------------------------------------

export async function listMenuItems(categoryId?: string) {
  const restaurantId = await getActiveRestaurantId();

  const [items, inventoryItems] = await Promise.all([
    db.menuItem.findMany({
      where: {
        restaurantId,
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: { name: "asc" },
      include: { category: true },
    }),
    db.inventoryItem.findMany({
      where: { restaurantId },
    }),
  ]);

  const inventoryMap = new Map(inventoryItems.map((inv) => [inv.id, inv]));

  return items.map((item) => {
    let stockStatus: "Available" | "Low Stock" | "Out of Stock" = item.isAvailable ? "Available" : "Out of Stock";
    let maxPortionsAvailable = 999;
    let effectiveIsAvailable = item.isAvailable;

    if (Array.isArray(item.recipe) && (item.recipe as any[]).length > 0) {
      let minPortions = Infinity;

      for (const ing of item.recipe as any[]) {
        if (!ing.inventoryItemId || !(ing.quantityRequired > 0)) continue;
        const inv = inventoryMap.get(ing.inventoryItemId);
        if (!inv) {
          minPortions = 0;
          break;
        }

        try {
          const reqInStockUnit = convertQuantity(
            ing.quantityRequired,
            ing.unit || inv.unit,
            inv.unit
          );
          if (reqInStockUnit <= 0) continue;
          const portions = Math.floor(inv.quantity / reqInStockUnit);
          if (portions < minPortions) {
            minPortions = portions;
          }
        } catch {
          minPortions = 0;
          break;
        }
      }

      if (minPortions === Infinity) minPortions = 999;
      maxPortionsAvailable = Math.max(0, minPortions);

      if (maxPortionsAvailable <= 0) {
        stockStatus = "Out of Stock";
        effectiveIsAvailable = false;
      } else if (maxPortionsAvailable <= 3) {
        stockStatus = "Low Stock";
        effectiveIsAvailable = item.isAvailable;
      } else {
        stockStatus = item.isAvailable ? "Available" : "Out of Stock";
        effectiveIsAvailable = item.isAvailable;
      }
    } else {
      effectiveIsAvailable = item.isAvailable;
    }

    return {
      ...item,
      effectiveIsAvailable,
      stockStatus,
      maxPortionsAvailable,
    };
  });
}

export async function createMenuItem(formData: FormData) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const variantsRaw = formData.get("variants");
  const recipeRaw = formData.get("recipe");

  const parsed = menuItemSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    isVeg: formData.get("isVeg"),
    isAvailable: formData.get("isAvailable") ?? true,
    variants: variantsRaw ? JSON.parse(variantsRaw as string) : undefined,
    recipe: recipeRaw ? JSON.parse(recipeRaw as string) : undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const category = await db.category.findFirst({
    where: { id: parsed.data.categoryId, restaurantId },
  });
  if (!category) throw new Error("Category not found");

  await validateRecipeTenantIsolation(restaurantId, parsed.data.recipe);

  const isSpecial = checkIsSpecialVariant(parsed.data.variants);

  const item = await db.$transaction(async (tx) => {
    const created = await tx.menuItem.create({
      data: { ...parsed.data, restaurantId },
    });

    await syncDailySpecial(tx, restaurantId, created, isSpecial);
    return created;
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/staff/specials");
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
    recipe: Array<{ inventoryItemId: string; quantityRequired: number; unit?: string }>;
  }>
) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const existing = await db.menuItem.findFirst({
    where: { id: menuItemId, restaurantId },
  });
  if (!existing) throw new Error("Menu item not found");

  if (data.recipe) {
    await validateRecipeTenantIsolation(restaurantId, data.recipe);
  }

  const isSpecialProvided = data.variants !== undefined;
  const isSpecial = isSpecialProvided
    ? checkIsSpecialVariant(data.variants)
    : checkIsSpecialVariant(existing.variants as any[]);

  const updated = await db.$transaction(async (tx) => {
    const item = await tx.menuItem.update({
      where: { id: menuItemId },
      data,
    });

    await syncDailySpecial(tx, restaurantId, item, isSpecial);
    return item;
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/staff/specials");
  return updated;
}

export async function toggleMenuItemAvailability(
  menuItemId: string,
  isAvailable: boolean
) {
  await requireRole(["owner", "admin", "staff"]);
  const restaurantId = await getActiveRestaurantId();

  const existing = await db.menuItem.findFirst({
    where: { id: menuItemId, restaurantId },
  });
  if (!existing) throw new Error("Menu item not found");

  const isSpecial = checkIsSpecialVariant(existing.variants as any[]);

  const updated = await db.$transaction(async (tx) => {
    const item = await tx.menuItem.update({
      where: { id: menuItemId },
      data: { isAvailable },
    });

    await syncDailySpecial(tx, restaurantId, item, isSpecial && isAvailable);
    return item;
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/staff/specials");
  return updated;
}

export async function deleteMenuItem(menuItemId: string) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const existing = await db.menuItem.findFirst({
    where: { id: menuItemId, restaurantId },
  });
  if (!existing) throw new Error("Menu item not found");

  await db.$transaction(async (tx) => {
    await syncDailySpecial(tx, restaurantId, existing, false);
    await tx.menuItem.delete({ where: { id: menuItemId } });
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/staff/specials");
}
