"use client";

import React, { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Receipt, Search, Download, User, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseItem {
  id: string;
  type: "Salary" | "Grocery";
  name: string; // Staff Name or Product Name
  amount: string;
  date: string;
  status: "Paid" | "Pending";
  // Salary specific
  month?: string;
  remarks?: string;
  // Grocery specific
  weight?: string;
  unit?: string;
  supplier?: string;
}

export default function ExpensesPage() {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseType, setExpenseType] = useState<"Salary" | "Grocery">("Salary");
  const [searchQuery, setSearchQuery] = useState("");

  // Salary form state
  const [staffName, setStaffName] = useState("Jon Bell");
  const [salaryAmount, setSalaryAmount] = useState("$3,400.00");
  const [month, setMonth] = useState("February 2024");
  const [paymentDate, setPaymentDate] = useState("2024-02-01");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Pending">("Paid");
  const [remarks, setRemarks] = useState("Monthly base salary");

  // Grocery form state
  const [productName, setProductName] = useState("Prime Beef Striploin");
  const [weight, setWeight] = useState("25");
  const [unit, setUnit] = useState("kg");
  const [groceryCost, setGroceryCost] = useState("$620.00");
  const [supplier, setSupplier] = useState("Wagyu Direct Ltd.");
  const [purchaseDate, setPurchaseDate] = useState("2024-02-05");

  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    {
      id: "EXP-101",
      type: "Salary",
      name: "Jon Bell (Sous Chef)",
      amount: "$3,400.00",
      date: "Feb 01, 2024",
      status: "Paid",
      month: "February 2024",
      remarks: "Monthly salary",
    },
    {
      id: "EXP-102",
      type: "Grocery",
      name: "Atlantic Salmon (15.5 kg)",
      amount: "$372.00",
      date: "Feb 04, 2024",
      status: "Paid",
      supplier: "OceanCatch Co.",
    },
    {
      id: "EXP-103",
      type: "Salary",
      name: "Maya Patel (Floor Lead)",
      amount: "$2,850.00",
      date: "Feb 01, 2024",
      status: "Paid",
      month: "February 2024",
    },
    {
      id: "EXP-104",
      type: "Grocery",
      name: "Organic Heirloom Tomatoes (30 kg)",
      amount: "$186.00",
      date: "Feb 06, 2024",
      status: "Pending",
      supplier: "GreenValley Farms",
    },
  ]);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();

    if (expenseType === "Salary") {
      const newExp: ExpenseItem = {
        id: `EXP-${Date.now().toString().slice(-3)}`,
        type: "Salary",
        name: staffName,
        amount: salaryAmount,
        date: paymentDate,
        status: paymentStatus,
        month,
        remarks,
      };
      setExpenses((prev) => [newExp, ...prev]);
    } else {
      const newExp: ExpenseItem = {
        id: `EXP-${Date.now().toString().slice(-3)}`,
        type: "Grocery",
        name: `${productName} (${weight} ${unit})`,
        amount: groceryCost,
        date: purchaseDate,
        status: "Paid",
        weight,
        unit,
        supplier,
      };
      setExpenses((prev) => [newExp, ...prev]);
    }

    setIsAddExpenseOpen(false);
  };

  const filteredExpenses = expenses.filter(
    (exp) =>
      exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Track operational disbursements, staff payroll, and grocery purchases.
          </p>
        </div>

        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="TOTAL EXPENSES THIS MONTH"
          value="$6,808.00"
          subtext="↘ 2.4% vs last month"
        />
        <StatCard
          label="STAFF PAYROLL DISBURSED"
          value="$6,250.00"
          subtext="↗ On target"
        />
        <StatCard
          label="GROCERY & SUPPLIES COST"
          value="$558.00"
          subtext="↘ 3.1% under target"
        />
      </div>

      {/* Expenses Table Card */}
      <div className="design-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <button
            onClick={() => alert("Exporting expenses log...")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Expenses</span>
          </button>
        </div>

        {/* Expenses Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                <th className="py-3 px-4">EXPENSE TYPE</th>
                <th className="py-3 px-4">NAME / DESCRIPTION</th>
                <th className="py-3 px-4">AMOUNT</th>
                <th className="py-3 px-4">DATE</th>
                <th className="py-3 px-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredExpenses.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                        item.type === "Salary"
                          ? "bg-purple-50 text-purple-700 border-purple-200/60"
                          : "bg-blue-50 text-blue-700 border-blue-200/60"
                      )}
                    >
                      {item.type === "Salary" ? (
                        <User className="w-3 h-3" />
                      ) : (
                        <ShoppingBag className="w-3 h-3" />
                      )}
                      <span>{item.type}</span>
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    {item.supplier && (
                      <div className="text-[11px] text-slate-400">Supplier: {item.supplier}</div>
                    )}
                    {item.remarks && (
                      <div className="text-[11px] text-slate-400">{item.remarks}</div>
                    )}
                  </td>

                  <td className="py-4 px-4 font-mono font-bold text-slate-900">
                    {item.amount}
                  </td>

                  <td className="py-4 px-4 text-slate-500 font-mono">
                    {item.date}
                  </td>

                  <td className="py-4 px-4">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Expense with Conditional Form Fields */}
      <Modal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Record New Expense"
        subtitle="Select expense type and fill in the required details."
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          {/* Expense Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Expense Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExpenseType("Salary")}
                className={cn(
                  "py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
                  expenseType === "Salary"
                    ? "bg-purple-50 text-purple-700 border-purple-300 ring-2 ring-purple-600/20"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                <User className="w-4 h-4" />
                <span>Salary</span>
              </button>

              <button
                type="button"
                onClick={() => setExpenseType("Grocery")}
                className={cn(
                  "py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
                  expenseType === "Grocery"
                    ? "bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-600/20"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Grocery (Raw Products)</span>
              </button>
            </div>
          </div>

          {/* Conditional Salary Fields */}
          {expenseType === "Salary" ? (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Member Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jon Bell"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Salary Amount
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. $3,400.00"
                    value={salaryAmount}
                    onChange={(e) => setSalaryAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Month
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. February 2024"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as "Paid" | "Pending")}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Base salary + performance bonus"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>
          ) : (
            /* Conditional Grocery Fields */
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wagyu Ribeye"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Weight
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 25"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
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
                    Cost
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. $620.00"
                    value={groceryCost}
                    onChange={(e) => setGroceryCost(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wagyu Direct Ltd."
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddExpenseOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0052ff] text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              Save Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
