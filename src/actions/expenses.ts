"use server";

// src/actions/expenses.ts
// Server Actions for Expense Management & Cost Control.
// Scope: Tenant isolated by active restaurantId.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, getActiveRestaurantId } from "@/lib/require-role";
export type ExpenseStatus = "PAID" | "PENDING" | "CANCELLED";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createExpenseSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  weight: z.coerce.number().optional(),
  unit: z.string().optional(),
  supplier: z.string().optional(),
  purchaseDate: z.coerce.date().optional(),
  status: z.enum(["PAID", "PENDING", "CANCELLED"]).default("PAID"),
});

// Helper check for model availability on PrismaClient
function getExpenseModel(): any | null {
  try {
    const client = db as any;
    if (client && client.expense && typeof client.expense.findMany === "function") {
      return client.expense;
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
 * Returns list of expenses for the calling user's active restaurant.
 * Order by date descending. Supports search on productName, name, or supplierName.
 */
export async function listExpenses(searchQuery?: string) {
  try {
    await requireRole(["owner", "admin", "staff"]);
    const restaurantId = await getActiveRestaurantId();

    const query = searchQuery?.trim().toLowerCase();
    const ExpenseModel = getExpenseModel();

    let rawExpenses: Array<any> = [];

    if (ExpenseModel) {
      rawExpenses = await ExpenseModel.findMany({
        where: {
          restaurantId,
          ...(query
            ? {
                OR: [
                  { productName: { contains: query, mode: "insensitive" } },
                  { name: { contains: query, mode: "insensitive" } },
                  { supplierName: { contains: query, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { date: "desc" },
        include: {
          supplier: true,
        },
      });
    } else {
      // Fallback SQL query if Prisma Client delegate is not bound in running process
      if (query) {
        rawExpenses = await db.$queryRaw`
          SELECT e.*, s.name as "supplier_name"
          FROM "Expense" e
          LEFT JOIN "Supplier" s ON e."supplierId" = s.id
          WHERE e."restaurantId" = ${restaurantId}
            AND (
              LOWER(e."productName") LIKE ${`%${query}%`} OR
              LOWER(e.name) LIKE ${`%${query}%`} OR
              LOWER(e."supplierName") LIKE ${`%${query}%`}
            )
          ORDER BY e.date DESC
        `;
      } else {
        rawExpenses = await db.$queryRaw`
          SELECT e.*, s.name as "supplier_name"
          FROM "Expense" e
          LEFT JOIN "Supplier" s ON e."supplierId" = s.id
          WHERE e."restaurantId" = ${restaurantId}
          ORDER BY e.date DESC
        `;
      }
    }

    return rawExpenses.map((exp) => {
      const statusVal = exp.status || "PAID";
      const formattedStatus =
        statusVal === "PAID"
          ? ("Paid" as const)
          : statusVal === "PENDING"
          ? ("Pending" as const)
          : ("Cancelled" as const);

      const dateObj = exp.date ? new Date(exp.date) : new Date();
      const dateFormatted = dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });

      return {
        id: exp.id,
        type: "Grocery" as const,
        name: exp.name,
        productName: exp.productName,
        weight: exp.weight?.toString(),
        unit: exp.unit ?? undefined,
        amount: `₹${Number(exp.amount || 0).toFixed(2)}`,
        rawAmount: Number(exp.amount || 0),
        date: dateFormatted,
        rawDate: dateObj.toISOString(),
        status: formattedStatus,
        supplier: exp.supplierName || exp.supplier_name || exp.supplier?.name || "N/A",
        supplierId: exp.supplierId ?? undefined,
      };
    });
  } catch (error) {
    console.error("Error in listExpenses:", error);
    return [];
  }
}

/**
 * Returns aggregate statistics for summary cards:
 * - Total Grocery Cost (sum of amounts)
 * - Grocery Orders Count
 * - Active Suppliers Count (unique non-null suppliers)
 */
export async function getExpenseStats() {
  try {
    await requireRole(["owner", "admin", "staff"]);
    const restaurantId = await getActiveRestaurantId();

    const ExpenseModel = getExpenseModel();
    let rawExpenses: Array<{ amount: number; supplierName?: string; supplierId?: string; supplier_name?: string }> = [];

    if (ExpenseModel) {
      rawExpenses = await ExpenseModel.findMany({
        where: { restaurantId },
        select: {
          amount: true,
          supplierName: true,
          supplierId: true,
        },
      });
    } else {
      rawExpenses = await db.$queryRaw`
        SELECT "amount", "supplierName", "supplierId"
        FROM "Expense"
        WHERE "restaurantId" = ${restaurantId}
      `;
    }

    let totalCost = 0;
    const uniqueSuppliers = new Set<string>();

    for (const exp of rawExpenses) {
      totalCost += Number(exp.amount || 0);
      const supp = exp.supplierId || exp.supplierName || exp.supplier_name;
      if (supp && String(supp).trim() !== "" && String(supp) !== "N/A") {
        uniqueSuppliers.add(String(supp).trim());
      }
    }

    return {
      totalGroceryCost: `₹${totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      groceryOrdersCount: `${rawExpenses.length} Purchases`,
      activeSuppliersCount: `${uniqueSuppliers.size} Vendors`,
    };
  } catch (error) {
    console.error("Error in getExpenseStats:", error);
    return {
      totalGroceryCost: "₹0.00",
      groceryOrdersCount: "0 Purchases",
      activeSuppliersCount: "0 Vendors",
    };
  }
}

/**
 * Records a new grocery expense. Owner and Admin only.
 * Handles supplier creation and links expense record.
 */
export async function createExpense(data: {
  productName: string;
  amount: number | string;
  weight?: number | string;
  unit?: string;
  supplier?: string;
  purchaseDate?: string;
  status?: ExpenseStatus;
}) {
  try {
    const ctx = await requireRole(["owner", "admin"]);
    const restaurantId = await getActiveRestaurantId();

    const parsed = createExpenseSchema.safeParse({
      ...data,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
    });

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message);
    }

    const { productName, amount, weight, unit, supplier: supplierInput, purchaseDate, status } = parsed.data;

    const formattedName =
      weight && unit
        ? `${productName} (${weight} ${unit})`
        : weight
        ? `${productName} (${weight})`
        : productName;

    const supplierNameTrimmed = supplierInput?.trim() || null;

    let linkedSupplierId: string | null = null;

    if (supplierNameTrimmed) {
      try {
        const existingSupplier = await db.supplier.findFirst({
          where: {
            restaurantId,
            name: { equals: supplierNameTrimmed, mode: "insensitive" },
          },
        });

        if (existingSupplier) {
          linkedSupplierId = existingSupplier.id;
        } else {
          const createdSupplier = await db.supplier.create({
            data: {
              restaurantId,
              name: supplierNameTrimmed,
            },
          });
          linkedSupplierId = createdSupplier.id;
        }
      } catch {
        // Fallback SQL for Supplier creation if needed
        const supRows: Array<{ id: string }> = await db.$queryRaw`
          SELECT id FROM "Supplier"
          WHERE "restaurantId" = ${restaurantId} AND LOWER(name) = ${supplierNameTrimmed.toLowerCase()}
          LIMIT 1
        `;

        if (supRows && supRows.length > 0) {
          linkedSupplierId = supRows[0].id;
        } else {
          const newSupId = `sup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const now = new Date();
          await db.$executeRawUnsafe(
            `INSERT INTO "Supplier" ("id", "restaurantId", "name", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5)`,
            newSupId, restaurantId, supplierNameTrimmed, now, now
          );
          linkedSupplierId = newSupId;
        }
      }
    }

    const ExpenseModel = getExpenseModel();
    let createdExpense: any = null;

    if (ExpenseModel) {
      createdExpense = await ExpenseModel.create({
        data: {
          restaurantId,
          productName,
          name: formattedName,
          weight: weight ?? null,
          unit: unit ?? null,
          amount,
          date: purchaseDate ?? new Date(),
          status: status ?? "PAID",
          supplierId: linkedSupplierId,
          supplierName: supplierNameTrimmed,
          createdById: ctx.userId,
        },
      });
    } else {
      // Fallback SQL insert using valid unsafe parameterized query
      const expId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const now = new Date();
      const dateVal = purchaseDate ?? now;
      const statusVal = status ?? "PAID";

      await db.$executeRawUnsafe(
        `INSERT INTO "Expense" ("id", "restaurantId", "productName", "name", "weight", "unit", "amount", "date", "status", "supplierId", "supplierName", "createdById", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::"ExpenseStatus", $10, $11, $12, $13, $14)`,
        expId, restaurantId, productName, formattedName, weight ?? null, unit ?? null, amount, dateVal, statusVal, linkedSupplierId, supplierNameTrimmed, ctx.userId, now, now
      );

      createdExpense = {
        id: expId,
        name: formattedName,
        productName,
        amount,
        date: dateVal,
        status: statusVal,
      };
    }

    revalidatePath("/dashboard", "layout");
    return createdExpense;
  } catch (error) {
    console.error("Error in createExpense:", error);
    throw error;
  }
}

/**
 * Deletes an expense record. Owner and Admin only.
 */
export async function deleteExpense(expenseId: string) {
  try {
    await requireRole(["owner", "admin"]);
    const restaurantId = await getActiveRestaurantId();

    const ExpenseModel = getExpenseModel();

    if (ExpenseModel) {
      const existing = await ExpenseModel.findFirst({
        where: { id: expenseId, restaurantId },
      });

      if (!existing) {
        throw new Error("Expense not found or unauthorized");
      }

      await ExpenseModel.delete({
        where: { id: expenseId },
      });
    } else {
      await db.$executeRawUnsafe(
        `DELETE FROM "Expense" WHERE "id" = $1 AND "restaurantId" = $2`,
        expenseId, restaurantId
      );
    }

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteExpense:", error);
    throw error;
  }
}

/**
 * Generates and returns CSV string data for exporting expense logs.
 */
export async function exportExpensesCSV() {
  try {
    await requireRole(["owner", "admin", "staff"]);
    const restaurantId = await getActiveRestaurantId();

    const ExpenseModel = getExpenseModel();
    let expenses: Array<any> = [];

    if (ExpenseModel) {
      expenses = await ExpenseModel.findMany({
        where: { restaurantId },
        orderBy: { date: "desc" },
        include: { supplier: true },
      });
    } else {
      expenses = await db.$queryRaw`
        SELECT e.*, s.name as "supplier_name"
        FROM "Expense" e
        LEFT JOIN "Supplier" s ON e."supplierId" = s.id
        WHERE e."restaurantId" = ${restaurantId}
        ORDER BY e.date DESC
      `;
    }

    const headers = ["Expense ID", "Product Name", "Full Description", "Supplier", "Amount (INR)", "Date", "Status"];
    const rows = expenses.map((exp) => [
      `"${exp.id}"`,
      `"${(exp.productName || "").replace(/"/g, '""')}"`,
      `"${(exp.name || "").replace(/"/g, '""')}"`,
      `"${(exp.supplierName || exp.supplier_name || exp.supplier?.name || "N/A").replace(/"/g, '""')}"`,
      Number(exp.amount || 0).toFixed(2),
      exp.date ? new Date(exp.date).toISOString().slice(0, 10) : "",
      exp.status || "PAID",
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  } catch (error) {
    console.error("Error in exportExpensesCSV:", error);
    throw error;
  }
}
