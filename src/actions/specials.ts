"use server";

// src/actions/specials.ts
// Server Actions for Daily Specials management.
// Scope: Tenant isolated by active restaurantId.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, getActiveRestaurantId } from "@/lib/require-role";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createDailySpecialSchema = z
  .object({
    name: z.string().min(1, "Dish name is required"),
    category: z.string().min(1, "Category is required"),
    regularPrice: z.coerce.number().positive("Regular price must be positive"),
    todayPrice: z.coerce.number().positive("Today's price must be positive"),
    availableQty: z.string().default("Available"),
    chefRecommendation: z.string().default("Must Try ⭐"),
    description: z.string().min(1, "Description is required"),
    menuItemId: z.string().optional(),
    discount: z.string().optional(),
  })
  .refine((data) => data.todayPrice <= data.regularPrice, {
    message: "Today's price cannot exceed regular price",
    path: ["todayPrice"],
  });

function getDailySpecialModel(): any | null {
  try {
    const client = db as any;
    if (client && client.dailySpecial && typeof client.dailySpecial.findMany === "function") {
      return client.dailySpecial;
    }
  } catch {
    // Ignore error
  }
  return null;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Returns list of active daily specials for the calling user's active restaurant.
 * Supports filtering by category and search query.
 */
export async function listDailySpecials(searchQuery?: string, category?: string) {
  try {
    await requireRole(["owner", "admin", "staff"]);
    const restaurantId = await getActiveRestaurantId();

    const query = searchQuery?.trim().toLowerCase();
    const isAllCategory = !category || category.toLowerCase() === "all";

    const SpecialModel = getDailySpecialModel();
    let rawSpecials: Array<any> = [];

    if (SpecialModel) {
      rawSpecials = await SpecialModel.findMany({
        where: {
          restaurantId,
          isAvailable: true,
          ...(!isAllCategory ? { category: { equals: category, mode: "insensitive" } } : {}),
          ...(query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { category: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      if (query && !isAllCategory) {
        rawSpecials = await db.$queryRaw`
          SELECT * FROM "DailySpecial"
          WHERE "restaurantId" = ${restaurantId}
            AND "isAvailable" = true
            AND LOWER("category") = ${category!.toLowerCase()}
            AND (
              LOWER("name") LIKE ${`%${query}%`} OR
              LOWER("category") LIKE ${`%${query}%`} OR
              LOWER("description") LIKE ${`%${query}%`}
            )
          ORDER BY "createdAt" DESC
        `;
      } else if (!isAllCategory) {
        rawSpecials = await db.$queryRaw`
          SELECT * FROM "DailySpecial"
          WHERE "restaurantId" = ${restaurantId}
            AND "isAvailable" = true
            AND LOWER("category") = ${category!.toLowerCase()}
          ORDER BY "createdAt" DESC
        `;
      } else if (query) {
        rawSpecials = await db.$queryRaw`
          SELECT * FROM "DailySpecial"
          WHERE "restaurantId" = ${restaurantId}
            AND "isAvailable" = true
            AND (
              LOWER("name") LIKE ${`%${query}%`} OR
              LOWER("category") LIKE ${`%${query}%`} OR
              LOWER("description") LIKE ${`%${query}%`}
            )
          ORDER BY "createdAt" DESC
        `;
      } else {
        rawSpecials = await db.$queryRaw`
          SELECT * FROM "DailySpecial"
          WHERE "restaurantId" = ${restaurantId}
            AND "isAvailable" = true
          ORDER BY "createdAt" DESC
        `;
      }
    }

    return rawSpecials.map((item) => {
      const regPrice = Number(item.regularPrice || 0);
      const todPrice = Number(item.todayPrice || 0);

      const discountText =
        item.discount ||
        `${Math.max(0, Math.round((1 - todPrice / (regPrice || 1)) * 100))}% OFF`;

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        regularPrice: `₹${regPrice.toFixed(2)}`,
        rawRegularPrice: regPrice,
        todayPrice: `₹${todPrice.toFixed(2)}`,
        rawTodayPrice: todPrice,
        discount: discountText,
        availableQty: item.availableQty || "Available",
        chefRecommendation: (item.chefRecommendation || "Must Try ⭐") as "Must Try ⭐" | "Signature Dish" | "Seasonal Special",
        description: item.description,
        isAvailable: item.isAvailable,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error("Error in listDailySpecials:", error);
    return [];
  }
}

/**
 * Returns aggregate stats for Daily Specials summary cards:
 * - TODAY'S SPECIAL DISHES (count of active specials)
 * - CHEF RECOMMENDATIONS (count of Must Try / Signature Dish items)
 * - SPECIAL OFFER SAVINGS (highest discount rate)
 */
export async function getDailySpecialStats() {
  try {
    await requireRole(["owner", "admin", "staff"]);
    const restaurantId = await getActiveRestaurantId();

    const SpecialModel = getDailySpecialModel();
    let rawSpecials: Array<{ regularPrice: number; todayPrice: number; chefRecommendation: string }> = [];

    if (SpecialModel) {
      rawSpecials = await SpecialModel.findMany({
        where: { restaurantId, isAvailable: true },
        select: {
          regularPrice: true,
          todayPrice: true,
          chefRecommendation: true,
        },
      });
    } else {
      rawSpecials = await db.$queryRaw`
        SELECT "regularPrice", "todayPrice", "chefRecommendation"
        FROM "DailySpecial"
        WHERE "restaurantId" = ${restaurantId} AND "isAvailable" = true
      `;
    }

    let signatureCount = 0;
    let maxDiscountPercent = 0;

    for (const spec of rawSpecials) {
      const rec = String(spec.chefRecommendation || "");
      if (rec.includes("Signature") || rec.includes("Must Try") || rec.includes("⭐")) {
        signatureCount += 1;
      }

      const reg = Number(spec.regularPrice || 0);
      const tod = Number(spec.todayPrice || 0);
      if (reg > 0) {
        const pct = Math.round((1 - tod / reg) * 100);
        if (pct > maxDiscountPercent) {
          maxDiscountPercent = pct;
        }
      }
    }

    return {
      totalSpecials: rawSpecials.length,
      signatureCount,
      maxSavingsText: maxDiscountPercent > 0 ? `Up to ${maxDiscountPercent}% OFF` : "Standard Pricing",
    };
  } catch (error) {
    console.error("Error in getDailySpecialStats:", error);
    return {
      totalSpecials: 0,
      signatureCount: 0,
      maxSavingsText: "0% OFF",
    };
  }
}

/**
 * Creates a new daily special. Owner and Admin only.
 */
export async function createDailySpecial(data: {
  name: string;
  category: string;
  regularPrice: number | string;
  todayPrice: number | string;
  availableQty?: string;
  chefRecommendation?: string;
  description: string;
  menuItemId?: string;
}) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const parsed = createDailySpecialSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const {
    name,
    category,
    regularPrice,
    todayPrice,
    availableQty,
    chefRecommendation,
    description,
    menuItemId,
  } = parsed.data;

  const calculatedDiscount = `${Math.round((1 - todayPrice / regularPrice) * 100)}% OFF`;

  const SpecialModel = getDailySpecialModel();
  let newSpecial: any = null;

  if (SpecialModel) {
    newSpecial = await SpecialModel.create({
      data: {
        restaurantId,
        menuItemId: menuItemId || null,
        name,
        category,
        regularPrice,
        todayPrice,
        discount: calculatedDiscount,
        availableQty: availableQty || "Available",
        chefRecommendation: chefRecommendation || "Must Try ⭐",
        description,
        isAvailable: true,
      },
    });
  } else {
    const spId = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();

    await db.$executeRaw`
      INSERT INTO "DailySpecial" (
        "id", "restaurantId", "menuItemId", "name", "category", "regularPrice", "todayPrice", "discount", "availableQty", "chefRecommendation", "description", "isAvailable", "date", "createdAt", "updatedAt"
      ) VALUES (
        ${spId}, ${restaurantId}, ${menuItemId || null}, ${name}, ${category}, ${regularPrice}, ${todayPrice}, ${calculatedDiscount}, ${availableQty || "Available"}, ${chefRecommendation || "Must Try ⭐"}, ${description}, true, ${now}, ${now}, ${now}
      )
    `;

    newSpecial = {
      id: spId,
      name,
      category,
      regularPrice,
      todayPrice,
      discount: calculatedDiscount,
    };
  }

  revalidatePath("/staff/specials");
  return newSpecial;
}

/**
 * Deletes a daily special record. Owner and Admin only.
 */
export async function deleteDailySpecial(id: string) {
  await requireRole(["owner", "admin"]);
  const restaurantId = await getActiveRestaurantId();

  const SpecialModel = getDailySpecialModel();

  if (SpecialModel) {
    const existing = await SpecialModel.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      throw new Error("Daily special not found or unauthorized");
    }

    await SpecialModel.delete({
      where: { id },
    });
  } else {
    await db.$executeRaw`
      DELETE FROM "DailySpecial" WHERE "id" = ${id} AND "restaurantId" = ${restaurantId}
    `;
  }

  revalidatePath("/staff/specials");
  return { success: true };
}
