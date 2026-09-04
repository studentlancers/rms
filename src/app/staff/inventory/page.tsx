"use client";

import React, { useState, useEffect, useMemo } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Modal } from "@/components/ui/modal";
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
import {
  Search,
  Download,
  Package,
  Loader2,
  Calendar,
  Flame,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import {
  listInventoryItems,
  getInventoryStats,
  exportInventoryCSV,
  getDailyInventoryLedger,
  getMonthlyInventoryLedger,
  recordWastage,
} from "@/actions/inventory";

export default function StaffInventoryPage() {
  const [activeTab, setActiveTab] = useState<"current" | "daily" | "monthly">("current");
  const [isWastageOpen, setIsWastageOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  // Categories list
  const [categories, setCategories] = useState<string[]>([
    "Protein",
    "Dairy",
    "Beverage",
    "Produce",
    "Dry goods",
  ]);

  // Form states for Wastage
  const [wastageItemId, setWastageItemId] = useState("");
  const [wastageQty, setWastageQty] = useState("");
  const [wastageReason, setWastageReason] = useState("");

  // Daily & Monthly State
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [dailyData, setDailyData] = useState<any>(null);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [monthlyData, setMonthlyData] = useState<any>(null);

  // Backend Telemetry State
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalValue: "₹0.00",
    lowStockCount: "0",
    foodCostPercentage: "28.4%",
    totalItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const isFetchingRef = React.useRef(false);

  // Load Inventory Data from Server Actions
  const loadData = async (silent = false) => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (!silent) setIsLoading(true);
      const [items, currentStats, daily, monthly] = await Promise.all([
        listInventoryItems(),
        getInventoryStats(),
        getDailyInventoryLedger(selectedDate),
        getMonthlyInventoryLedger(selectedYear, selectedMonth),
      ]);

      setInventoryItems(items || []);
      setStats(currentStats);
      setDailyData(daily);
      setMonthlyData(monthly);

      if (items && items.length > 0) {
        const dbCategories = Array.from(new Set(items.map((i: any) => i.category)));
        setCategories((prev) => Array.from(new Set([...prev, ...dbCategories])));
      }
    } catch (err: any) {
      console.error("Error loading staff inventory:", err);
      if (!silent) toast.error("Failed to load inventory telemetry");
    } finally {
      isFetchingRef.current = false;
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 20-second polling interval with visibility guard for inventory telemetry
    const interval = setInterval(() => {
      loadData(true);
    }, 20000);

    return () => clearInterval(interval);
  }, [selectedDate, selectedYear, selectedMonth]);

  const handleRecordWastageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wastageItemId) {
      toast.error("Please select an inventory item");
      return;
    }
    const qty = parseFloat(wastageQty);
    if (!qty || qty <= 0) {
      toast.error("Please enter a valid wastage quantity");
      return;
    }

    setIsSubmitting(true);
    try {
      await recordWastage({
        inventoryItemId: wastageItemId,
        quantity: qty,
        reason: wastageReason.trim() || "Staff wastage log",
      });

      toast.success("Wastage recorded successfully");
      setIsWastageOpen(false);
      setWastageQty("");
      setWastageReason("");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to record wastage");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const csvText = await exportInventoryCSV();

      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `staff_inventory_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Inventory CSV exported successfully!");
    } catch (err: any) {
      toast.error("Failed to export inventory CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategoryFilter === "All" || item.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [inventoryItems, searchQuery, selectedCategoryFilter]);

  const filteredDailyItems = useMemo(() => {
    if (!dailyData || !dailyData.items) return [];
    return dailyData.items.filter((item: any) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategoryFilter === "All" || item.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [dailyData, searchQuery, selectedCategoryFilter]);

  const filteredMonthlyItems = useMemo(() => {
    if (!monthlyData || !monthlyData.items) return [];
    return monthlyData.items.filter((item: any) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategoryFilter === "All" || item.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [monthlyData, searchQuery, selectedCategoryFilter]);

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">STAFF WORKSPACE — INVENTORY VIEW</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Shift Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track live stock balances, daily kitchen logs, and record ingredient wastage.
          </p>
        </div>

        <Button
          onClick={() => {
            if (inventoryItems.length > 0) setWastageItemId(inventoryItems[0].id);
            setIsWastageOpen(true);
          }}
          variant="outline"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer h-9 self-start md:self-auto"
        >
          <Flame className="w-4 h-4 text-rose-500" />
          <span>Record Wastage</span>
        </Button>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("current")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "current"
              ? "bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Current Stock ({inventoryItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("daily")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "daily"
              ? "bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Inventory</span>
        </button>

        <button
          onClick={() => setActiveTab("monthly")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "monthly"
              ? "bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Monthly Inventory</span>
        </button>
      </div>

      {/* TAB 1: CURRENT LIVE STOCK */}
      {activeTab === "current" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard
              label="INVENTORY VALUE"
              value={isLoading ? "..." : stats.totalValue}
              subtext="live PostgreSQL database"
            />
            <StatCard
              label="LOW STOCK ITEMS"
              value={isLoading ? "..." : stats.lowStockCount}
              subtext="items below reorder threshold"
            />
            <StatCard
              label="FOOD COST EFFICIENCY"
              value={isLoading ? "..." : stats.foodCostPercentage}
              subtext="target efficiency metric"
            />
          </div>

          <div className="design-surface p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
                <Input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 h-9 bg-slate-50 border-slate-200/80 rounded-xl text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-600/20"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none cursor-pointer h-9"
                >
                  <option value="All">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3.5 py-2 h-9 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-slate-500" />}
                  <span>Export</span>
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono">ITEM</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono">TYPE</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono">STOCK</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono">UNIT COST</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono w-48">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 text-xs">
                {isLoading && inventoryItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading shift stock telemetry...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                      No inventory items registered.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                      <TableCell className="py-4 px-4 font-semibold text-slate-900">
                        {item.name}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {item.category} {item.supplier?.name ? `• ${item.supplier.name}` : ""}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.inventoryType === "DAILY" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {item.inventoryType || "DAILY"}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                        {item.onHandFormatted}
                      </TableCell>
                      <TableCell className="py-4 px-4 font-mono text-slate-600">
                        {item.unitCostFormatted}
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-semibold">
                            <span className={item.status === "Low" ? "text-rose-600 font-bold" : "text-emerald-600"}>
                              {item.status === "Low" ? "⚠️ Low Stock" : "🟢 Healthy"}
                            </span>
                            <span className="text-slate-400 font-mono">{item.percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                item.status === "Low" ? "bg-rose-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY INVENTORY LEDGER */}
      {activeTab === "daily" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Select Date</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-bold text-slate-900 cursor-pointer focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="TOTAL OPENING" value={dailyData?.totals?.totalOpening?.toFixed(2) || "0.00"} subtext="start of day balance" />
            <StatCard label="TODAY'S PURCHASES" value={`+${dailyData?.totals?.totalPurchases?.toFixed(2) || "0.00"}`} subtext="stock additions" />
            <StatCard label="TODAY'S USAGE" value={`-${dailyData?.totals?.totalUsage?.toFixed(2) || "0.00"}`} subtext="recipe & order deduction" />
            <StatCard label="TODAY'S WASTAGE" value={`-${dailyData?.totals?.totalWastage?.toFixed(2) || "0.00"}`} subtext="spoilage / loss" />
            <StatCard label="SYSTEM CLOSING" value={dailyData?.totals?.totalClosing?.toFixed(2) || "0.00"} subtext="net shift stock" />
          </div>

          <div className="design-surface p-6">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono">PRODUCT</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono">TYPE</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono">OPENING</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono">PURCHASE</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono">USAGE</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono">WASTAGE</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-bold text-slate-900">CLOSING STOCK</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 text-xs font-mono">
                {filteredDailyItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400 font-sans">
                      No daily inventory logs found for this date.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDailyItems.map((item: any) => (
                    <TableRow key={item.inventoryItemId} className="hover:bg-slate-50/80">
                      <TableCell className="py-4 px-4 font-sans font-bold text-slate-900">{item.name}</TableCell>
                      <TableCell className="py-4 px-4 font-sans">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.inventoryType === "DAILY" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                          {item.inventoryType}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-4 font-semibold text-slate-700">{item.openingStock} {item.unit}</TableCell>
                      <TableCell className="py-4 px-4 font-semibold text-emerald-600">+{item.purchases} {item.unit}</TableCell>
                      <TableCell className="py-4 px-4 font-semibold text-blue-600">-{item.usage} {item.unit}</TableCell>
                      <TableCell className="py-4 px-4 font-semibold text-rose-600">-{item.wastage} {item.unit}</TableCell>
                      <TableCell className="py-4 px-4 font-bold text-slate-900 bg-slate-50">
                        {item.isClosed ? `${item.closingStock} ${item.unit} (Final)` : `${item.systemClosing.toFixed(2)} ${item.unit}`}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 3: MONTHLY INVENTORY SUMMARY */}
      {activeTab === "monthly" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-900 cursor-pointer focus:outline-none"
                >
                  {monthsList.map((m, idx) => (
                    <option key={idx} value={idx}>{m}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-900 cursor-pointer focus:outline-none"
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="MONTH OPENING" value={monthlyData?.totals?.totalOpening?.toFixed(2) || "0.00"} subtext="1st day of month balance" />
            <StatCard label="MONTH PURCHASES" value={`+${monthlyData?.totals?.totalPurchases?.toFixed(2) || "0.00"}`} subtext="total bought in month" />
            <StatCard label="MONTH USAGE" value={`-${monthlyData?.totals?.totalUsage?.toFixed(2) || "0.00"}`} subtext="total cooked & sold" />
            <StatCard label="MONTH WASTAGE" value={`-${monthlyData?.totals?.totalWastage?.toFixed(2) || "0.00"}`} subtext="total lost in month" />
            <StatCard label="MONTH CLOSING" value={monthlyData?.totals?.totalClosing?.toFixed(2) || "0.00"} subtext="month-end balance" />
          </div>

          <div className="design-surface p-6">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono">PRODUCT</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono">TYPE</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono">MONTH OPENING</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono">PURCHASES</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono">USAGE</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono">WASTAGE</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-bold text-slate-900">MONTH CLOSING</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 text-xs font-mono">
                {filteredMonthlyItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400 font-sans">
                      No monthly inventory logs found for this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMonthlyItems.map((item: any) => (
                    <TableRow key={item.inventoryItemId} className="hover:bg-slate-50/80">
                      <TableCell className="py-4 px-4 font-sans font-bold text-slate-900">{item.name}</TableCell>
                      <TableCell className="py-4 px-4 font-sans">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.inventoryType === "DAILY" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                          {item.inventoryType}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-4 font-semibold text-slate-700">{item.openingStock} {item.unit}</TableCell>
                      <TableCell className="py-4 px-4 font-semibold text-emerald-600">+{item.purchases} {item.unit}</TableCell>
                      <TableCell className="py-4 px-4 font-semibold text-blue-600">-{item.usage} {item.unit}</TableCell>
                      <TableCell className="py-4 px-4 font-semibold text-rose-600">-{item.wastage} {item.unit}</TableCell>
                      <TableCell className="py-4 px-4 font-bold text-slate-900 bg-slate-50">{item.closingStock.toFixed(2)} {item.unit}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Modal: Record Wastage (Staff) */}
      <Modal
        isOpen={isWastageOpen}
        onClose={() => setIsWastageOpen(false)}
        title="Record Kitchen Wastage"
        subtitle="Log spoiled, damaged, or expired ingredients during shift."
      >
        <form onSubmit={handleRecordWastageSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Item *</label>
            <select
              value={wastageItemId}
              onChange={(e) => setWastageItemId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
            >
              {inventoryItems.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name} ({inv.quantity} {inv.unit} on hand)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Wastage Quantity *</label>
            <Input
              type="number"
              step="0.01"
              required
              value={wastageQty}
              onChange={(e) => setWastageQty(e.target.value)}
              placeholder="e.g. 0.50"
              className="w-full px-3 py-2 text-xs rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Notes</label>
            <Input
              type="text"
              value={wastageReason}
              onChange={(e) => setWastageReason(e.target.value)}
              placeholder="e.g. Expired, Spilled in kitchen"
              className="w-full px-3 py-2 text-xs rounded-xl"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsWastageOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-5 py-2 rounded-xl">
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Record Wastage"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
