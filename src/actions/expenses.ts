"use server";

// src/actions/expenses.ts
// Server Actions for Expense Management & Cost Control.
// Scope: Tenant isolated by active restaurantId.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, getActiveRestaurantId } from "@/lib/require-role";

export type ExpenseType = "GENERAL" | "INVENTORY";
export type ExpenseStatus = "PAID" | "PENDING" | "CANCELLED";

import { trimmedString, optionalTrimmedString, positiveMoneySchema } from "@/lib/validation";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createExpenseSchema = z.object({
  name: trimmedString(1, 120, "Expense name"),
  description: optionalTrimmedString(300, "Description"),
  staffUserId: optionalTrimmedString(100, "Staff user ID"),
  amount: positiveMoneySchema("Amount", 10_000_000),
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
 * Returns list of staff members belonging to the active restaurant.
 * Used for Staff Tag dropdown selection in General Expenses form.
 */
export async function getRestaurantStaff() {
  try {
    await requireRole(["owner", "admin", "staff"]);
    const restaurantId = await getActiveRestaurantId();

    const members = await db.member.findMany({
      where: { organizationId: restaurantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return members.map((m) => ({
      id: m.userId,
      name: m.user.name || m.user.email || "Staff Member",
      email: m.user.email,
      role: m.role,
    }));
  } catch (error) {
    console.error("Error in getRestaurantStaff:", error);
    return [];
  }
}

/**
 * Returns list of expenses (both GENERAL and INVENTORY) for the active restaurant.
 * Order by date descending. Supports search on name, description, productName, supplierName, and staff name.
 */
export async function listExpenses(searchQuery?: string) {
  try {
    await requireRole(["owner", "admin", "staff"]);
    const restaurantId = await getActiveRestaurantId();

    const query = searchQuery?.trim().toLowerCase();
    const ExpenseModel = getExpenseModel();

    let rawExpenses: Array<any> = [];

    if (ExpenseModel) {
      try {
        rawExpenses = await ExpenseModel.findMany({
          where: {
            restaurantId,
            ...(query
              ? {
                  OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                    { productName: { contains: query, mode: "insensitive" } },
                    { supplierName: { contains: query, mode: "insensitive" } },
                    { staffUser: { name: { contains: query, mode: "insensitive" } } },
                  ],
                }
              : {}),
          },
          orderBy: { date: "desc" },
          include: {
            supplier: true,
            staffUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
      } catch {
        // Fallback SQL query if Prisma Client delegate has stale runtime schema metadata
        if (query) {
          rawExpenses = await db.$queryRaw`
            SELECT e.*, s.name as "supplier_name", u.name as "staff_name"
            FROM "Expense" e
            LEFT JOIN "Supplier" s ON e."supplierId" = s.id
            LEFT JOIN "user" u ON e."staffUserId" = u.id
            WHERE e."restaurantId" = ${restaurantId}
              AND (
                LOWER(e.name) LIKE ${`%${query}%`} OR
                LOWER(COALESCE(e.description, '')) LIKE ${`%${query}%`} OR
                LOWER(COALESCE(e."productName", '')) LIKE ${`%${query}%`} OR
                LOWER(COALESCE(e."supplierName", '')) LIKE ${`%${query}%`} OR
                LOWER(COALESCE(u.name, '')) LIKE ${`%${query}%`}
              )
            ORDER BY e.date DESC
          `;
        } else {
          rawExpenses = await db.$queryRaw`
            SELECT e.*, s.name as "supplier_name", u.name as "staff_name"
            FROM "Expense" e
            LEFT JOIN "Supplier" s ON e."supplierId" = s.id
            LEFT JOIN "user" u ON e."staffUserId" = u.id
            WHERE e."restaurantId" = ${restaurantId}
            ORDER BY e.date DESC
          `;
        }
      }
    } else {
      if (query) {
        rawExpenses = await db.$queryRaw`
          SELECT e.*, s.name as "supplier_name", u.name as "staff_name"
          FROM "Expense" e
          LEFT JOIN "Supplier" s ON e."supplierId" = s.id
          LEFT JOIN "user" u ON e."staffUserId" = u.id
          WHERE e."restaurantId" = ${restaurantId}
            AND (
              LOWER(e.name) LIKE ${`%${query}%`} OR
              LOWER(COALESCE(e.description, '')) LIKE ${`%${query}%`} OR
              LOWER(COALESCE(e."productName", '')) LIKE ${`%${query}%`} OR
              LOWER(COALESCE(e."supplierName", '')) LIKE ${`%${query}%`} OR
              LOWER(COALESCE(u.name, '')) LIKE ${`%${query}%`}
            )
          ORDER BY e.date DESC
        `;
      } else {
        rawExpenses = await db.$queryRaw`
          SELECT e.*, s.name as "supplier_name", u.name as "staff_name"
          FROM "Expense" e
          LEFT JOIN "Supplier" s ON e."supplierId" = s.id
          LEFT JOIN "user" u ON e."staffUserId" = u.id
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

      const expenseType: "GENERAL" | "INVENTORY" = exp.type === "INVENTORY" ? "INVENTORY" : "GENERAL";
      const staffName = exp.staffUser?.name || exp.staff_name || "N/A";

      return {
        id: exp.id,
        type: expenseType,
        name: exp.name,
        description: exp.description || exp.productName || "",
        productName: exp.productName ?? undefined,
        weight: exp.weight?.toString(),
        unit: exp.unit ?? undefined,
        amount: `₹${Number(exp.amount || 0).toFixed(2)}`,
        rawAmount: Number(exp.amount || 0),
        date: dateFormatted,
        rawDate: dateObj.toISOString(),
        status: formattedStatus,
        supplier: exp.supplierName || exp.supplier_name || exp.supplier?.name || "N/A",
        supplierId: exp.supplierId ?? undefined,
        staff: staffName,
        staffUserId: exp.staffUserId ?? undefined,
        inventoryItemId: exp.inventoryItemId ?? undefined,
      };
    });
  } catch (error) {
    console.error("Error in listExpenses:", error);
    return [];
  }
}

/**
 * Returns aggregate statistics for summary cards:
 * Sums both GENERAL and INVENTORY expenses.
 */
export async function getExpenseStats() {
  try {
    await requireRole(["owner", "admin", "staff"]);
    const restaurantId = await getActiveRestaurantId();

    const ExpenseModel = getExpenseModel();
    let rawExpenses: Array<{ amount: number; supplierName?: string; supplierId?: string; supplier_name?: string }> = [];

    if (ExpenseModel) {
      try {
        rawExpenses = await ExpenseModel.findMany({
          where: { restaurantId },
          select: {
            amount: true,
            supplierName: true,
            supplierId: true,
          },
        });
      } catch {
        rawExpenses = await db.$queryRaw`
          SELECT "amount", "supplierName", "supplierId"
          FROM "Expense"
          WHERE "restaurantId" = ${restaurantId}
        `;
      }
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
      groceryOrdersCount: `${rawExpenses.length} Records`,
      activeSuppliersCount: `${uniqueSuppliers.size} Vendors`,
    };
  } catch (error) {
    console.error("Error in getExpenseStats:", error);
    return {
      totalGroceryCost: "₹0.00",
      groceryOrdersCount: "0 Records",
      activeSuppliersCount: "0 Vendors",
    };
  }
}

/**
 * Creates a new General Expense. Owner and Admin only.
 * Validates staff tag belongs to active restaurant tenant.
 */
export async function createExpense(data: {
  name: string;
  description?: string;
  staffUserId?: string;
  amount: number | string;
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

    const { name, description, staffUserId, amount, purchaseDate, status } = parsed.data;

    let validStaffUserId: string | null = null;
    if (staffUserId && staffUserId.trim() !== "") {
      const member = await db.member.findFirst({
        where: {
          organizationId: restaurantId,
          userId: staffUserId.trim(),
        },
      });

      if (!member) {
        throw new Error("Selected staff member does not belong to this active restaurant");
      }
      validStaffUserId = member.userId;
    }

    const ExpenseModel = getExpenseModel();
    let createdExpense: any = null;

    if (ExpenseModel) {
      try {
        createdExpense = await ExpenseModel.create({
          data: {
            restaurantId,
            type: "GENERAL",
            name,
            description: description?.trim() || null,
            staffUserId: validStaffUserId,
            amount,
            date: purchaseDate ?? new Date(),
            status: status ?? "PAID",
            createdById: ctx.userId,
          },
        });
      } catch {
        const expId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const now = new Date();
        const dateVal = purchaseDate ?? now;
        const statusVal = status ?? "PAID";

        await db.$executeRawUnsafe(
          `INSERT INTO "Expense" ("id", "restaurantId", "type", "name", "description", "staffUserId", "amount", "date", "status", "createdById", "createdAt", "updatedAt") VALUES ($1, $2, 'GENERAL'::"ExpenseType", $3, $4, $5, $6, $7, $8::"ExpenseStatus", $9, $10, $11)`,
          expId, restaurantId, name, description?.trim() || null, validStaffUserId, amount, dateVal, statusVal, ctx.userId, now, now
        );

        createdExpense = {
          id: expId,
          type: "GENERAL",
          name,
          description,
          amount,
          date: dateVal,
          status: statusVal,
        };
      }
    } else {
      const expId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const now = new Date();
      const dateVal = purchaseDate ?? now;
      const statusVal = status ?? "PAID";

      await db.$executeRawUnsafe(
        `INSERT INTO "Expense" ("id", "restaurantId", "type", "name", "description", "staffUserId", "amount", "date", "status", "createdById", "createdAt", "updatedAt") VALUES ($1, $2, 'GENERAL'::"ExpenseType", $3, $4, $5, $6, $7, $8::"ExpenseStatus", $9, $10, $11)`,
        expId, restaurantId, name, description?.trim() || null, validStaffUserId, amount, dateVal, statusVal, ctx.userId, now, now
      );

      createdExpense = {
        id: expId,
        type: "GENERAL",
        name,
        description,
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
 * If expense is an INVENTORY expense linked to an InventoryItem, deleting the item handles deletion consistently.
 */
export async function deleteExpense(expenseId: string) {
  try {
    await requireRole(["owner", "admin"]);
    const restaurantId = await getActiveRestaurantId();

    const ExpenseModel = getExpenseModel();

    if (ExpenseModel) {
      try {
        const existing = await ExpenseModel.findFirst({
          where: { id: expenseId, restaurantId },
        });

        if (!existing) {
          throw new Error("Expense not found or unauthorized");
        }

        if (existing.type === "INVENTORY" && existing.inventoryItemId) {
          await db.inventoryItem.delete({
            where: { id: existing.inventoryItemId },
          });
        } else {
          await ExpenseModel.delete({
            where: { id: expenseId },
          });
        }
      } catch {
        await db.$executeRawUnsafe(
          `DELETE FROM "Expense" WHERE "id" = $1 AND "restaurantId" = $2`,
          expenseId, restaurantId
        );
      }
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
 * Generates and returns CSV string data for exporting expense logs (GENERAL and INVENTORY).
 */
export async function exportExpensesCSV() {
  try {
    await requireRole(["owner", "admin", "staff"]);
    const restaurantId = await getActiveRestaurantId();

    const ExpenseModel = getExpenseModel();
    let expenses: Array<any> = [];

    if (ExpenseModel) {
      try {
        expenses = await ExpenseModel.findMany({
          where: { restaurantId },
          orderBy: { date: "desc" },
          include: {
            supplier: true,
            staffUser: { select: { name: true, email: true } },
          },
        });
      } catch {
        expenses = await db.$queryRaw`
          SELECT e.*, s.name as "supplier_name", u.name as "staff_name"
          FROM "Expense" e
          LEFT JOIN "Supplier" s ON e."supplierId" = s.id
          LEFT JOIN "user" u ON e."staffUserId" = u.id
          WHERE e."restaurantId" = ${restaurantId}
          ORDER BY e.date DESC
        `;
      }
    } else {
      expenses = await db.$queryRaw`
        SELECT e.*, s.name as "supplier_name", u.name as "staff_name"
        FROM "Expense" e
        LEFT JOIN "Supplier" s ON e."supplierId" = s.id
        LEFT JOIN "user" u ON e."staffUserId" = u.id
        WHERE e."restaurantId" = ${restaurantId}
        ORDER BY e.date DESC
      `;
    }

    const headers = [
      "Expense ID",
      "Type",
      "Name",
      "Description / Product",
      "Staff Tag",
      "Supplier",
      "Amount (INR)",
      "Date",
      "Status",
    ];

    const rows = expenses.map((exp) => [
      `"${exp.id}"`,
      `"${exp.type || "GENERAL"}"`,
      `"${(exp.name || "").replace(/"/g, '""')}"`,
      `"${(exp.description || exp.productName || "").replace(/"/g, '""')}"`,
      `"${(exp.staffUser?.name || exp.staff_name || "N/A").replace(/"/g, '""')}"`,
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
