"use client";

import React, { useState, useEffect, useMemo } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Plus, Search, Download, ShoppingBag, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  listExpenses,
  getExpenseStats,
  createExpense,
  deleteExpense,
  exportExpensesCSV,
} from "@/actions/expenses";

interface ExpenseItemUI {
  id: string;
  type: "Grocery";
  name: string;
  productName?: string;
  amount: string;
  rawAmount?: number;
  date: string;
  status: "Paid" | "Pending" | "Cancelled";
  weight?: string;
  unit?: string;
  supplier?: string;
}

export default function ExpensesPage() {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Grocery form state
  const [productName, setProductName] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("kg");
  const [groceryCost, setGroceryCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");

  // Backend Telemetry State
  const [expenses, setExpenses] = useState<ExpenseItemUI[]>([]);
  const [stats, setStats] = useState({
    totalGroceryCost: "₹0.00",
    groceryOrdersCount: "0 Purchases",
    activeSuppliersCount: "0 Vendors",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load Expenses Data from Server Actions
  const loadData = async (query = searchQuery, silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [items, currentStats] = await Promise.all([
        listExpenses(query),
        getExpenseStats(),
      ]);

      setExpenses(items);
      setStats(currentStats);
    } catch (err: unknown) {
      console.error("Error loading expenses data:", err);
      if (!silent) {
        toast.error("Failed to load expense records");
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(searchQuery);

    // 5-second polling interval for live expense synchronization
    const interval = setInterval(() => {
      loadData(searchQuery, true);
    }, 5000);

    return () => clearInterval(interval);
  }, [searchQuery]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim()) {
      toast.error("Please provide a product name");
      return;
    }

    const numericCost = parseFloat(groceryCost.replace(/[^0-9.]/g, "")) || 0;
    if (numericCost <= 0) {
      toast.error("Please enter a valid expense cost");
      return;
    }

    const numericWeight = weight ? parseFloat(weight) : undefined;

    setIsSubmitting(true);
    try {
      await createExpense({
        productName: productName.trim(),
        amount: numericCost,
        weight: numericWeight,
        unit: unit || "kg",
        supplier: supplier.trim() || undefined,
        purchaseDate: purchaseDate || undefined,
        status: "PAID",
      });

      toast.success(`Expense for "${productName}" recorded successfully!`);
      setIsAddExpenseOpen(false);

      // Reset form
      setProductName("");
      setWeight("");
      setGroceryCost("");
      setSupplier("");
      setPurchaseDate("");

      await loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to record expense";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete expense "${name}"?`)) return;

    setDeletingId(id);
    try {
      await deleteExpense(id);
      toast.success(`Deleted expense "${name}"`);
      await loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete expense";
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const csvText = await exportExpensesCSV();

      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `grocery_expenses_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Grocery expenses log exported successfully!");
    } catch (err: unknown) {
      console.error("Export error:", err);
      toast.error("Failed to export expenses CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(
      (exp) =>
        exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.supplier && exp.supplier.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [expenses, searchQuery]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono font-semibold tracking-widest text-blue-600 uppercase mb-2">
            EXPENSE CONTROL & AUDIT
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Expenses
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track operational raw products and grocery purchases for your kitchen.
          </p>
        </div>

        <Button
          onClick={() => setIsAddExpenseOpen(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start md:self-auto cursor-pointer h-auto border-none"
        >
          <Plus className="w-4 h-4" />
          <span>Add Grocery Expense</span>
        </Button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="TOTAL GROCERY COST"
          value={isLoading ? "..." : stats.totalGroceryCost}
          subtext="live PostgreSQL database"
        />
        <StatCard
          label="GROCERY ORDERS"
          value={isLoading ? "..." : stats.groceryOrdersCount}
          subtext="all verified purchases"
        />
        <StatCard
          label="ACTIVE SUPPLIERS"
          value={isLoading ? "..." : stats.activeSuppliersCount}
          subtext="active vendor accounts"
        />
      </div>

      {/* Expenses Table Card */}
      <div className="design-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
            <Input
              type="text"
              placeholder="Search grocery expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 h-9 bg-slate-50 border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600/20"
            />
          </div>

          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 h-9 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-slate-500" />}
            <span>Export Expenses</span>
          </Button>
        </div>

        {/* Expenses Data Table */}
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">RAW PRODUCT / DESCRIPTION</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">SUPPLIER</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">AMOUNT</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">DATE</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STATUS</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-xs">
            {isLoading && expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Loading expense records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                  No grocery expenses recorded. Click &quot;Add Grocery Expense&quot; to log one.
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                  <TableCell className="py-4 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shrink-0">
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </div>
                      <div className="font-semibold text-slate-900">{item.name}</div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-4 text-slate-600">
                    {item.supplier || "N/A"}
                  </TableCell>

                  <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                    {item.amount}
                  </TableCell>

                  <TableCell className="py-4 px-4 text-slate-500 font-mono">
                    {item.date}
                  </TableCell>

                  <TableCell className="py-4 px-4">
                    <StatusBadge status={item.status} />
                  </TableCell>

                  <TableCell className="py-4 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id, item.name)}
                      className="h-8 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal: Add Grocery Expense */}
      <Modal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Record Grocery Expense"
        subtitle="Fill in raw product details, weight, cost, and supplier."
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Name *
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Wagyu Ribeye"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-sm focus-visible:ring-2 focus-visible:ring-blue-600/20"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Weight
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 25"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-sm focus-visible:ring-2 focus-visible:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-transparent cursor-pointer"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="lbs">lbs</option>
                <option value="pcs">pcs</option>
                <option value="bt">bt</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cost (₹) *
              </label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 620.00"
                value={groceryCost}
                onChange={(e) => setGroceryCost(e.target.value)}
                className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-sm focus-visible:ring-2 focus-visible:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g. Wagyu Direct Ltd."
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-sm focus-visible:ring-2 focus-visible:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Date
              </label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-sm focus-visible:ring-2 focus-visible:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddExpenseOpen(false)}
              className="px-4 py-2 h-9 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 h-9 rounded-xl bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-sm cursor-pointer border-none"
            >
              {isSubmitting ? "Saving..." : "Save Expense"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
