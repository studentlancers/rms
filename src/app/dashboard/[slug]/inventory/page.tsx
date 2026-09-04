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
  Plus,
  Search,
  Download,
  Package,
  FolderPlus,
  Trash2,
  Loader2,
  Calendar,
  Lock,
  Flame,
  FileSpreadsheet,
  PackagePlus,
  RefreshCw,
  History,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  listInventoryItems,
  getInventoryStats,
  createInventoryItem,
  deleteInventoryItem,
  exportInventoryCSV,
  getDailyInventoryLedger,
  closeDayInventory,
  recordWastage,
  getMonthlyInventoryLedger,
  adjustStock,
  listStockMovements,
} from "@/actions/inventory";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"current" | "daily" | "monthly" | "history">("current");
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [addItemMode, setAddItemMode] = useState<"new" | "restock">("new");
  const [isCloseDayOpen, setIsCloseDayOpen] = useState(false);
  const [isWastageOpen, setIsWastageOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  // Dynamic Categories state
  const [categories, setCategories] = useState<string[]>([
    "Protein",
    "Dairy",
    "Beverage",
    "Produce",
    "Dry goods",
  ]);

  // Form states for Add New Item
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Protein");
  const [newItemUnitCost, setNewItemUnitCost] = useState("");
  const [newItemOnHand, setNewItemOnHand] = useState("10");
  const [newItemUnit, setNewItemUnit] = useState("kg");
  const [newItemType, setNewItemType] = useState<"DAILY" | "MONTHLY">("DAILY");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");

  // Form states for Re-stocking Existing Item
  const [adjustItemId, setAdjustItemId] = useState("");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"PURCHASE" | "ADJUSTMENT">("PURCHASE");
  const [adjustReason, setAdjustReason] = useState("");

  // Form states for Wastage
  const [wastageItemId, setWastageItemId] = useState("");
  const [wastageQty, setWastageQty] = useState("");
  const [wastageReason, setWastageReason] = useState("");

  // Daily & Monthly State
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [dailyData, setDailyData] = useState<any>(null);
  const [closePhysicalCounts, setClosePhysicalCounts] = useState<{ [key: string]: number }>({});

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [monthlyData, setMonthlyData] = useState<any>(null);

  // Stock History State
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [historyTypeFilter, setHistoryTypeFilter] = useState("ALL");
  const [historyItemFilter, setHistoryItemFilter] = useState("ALL");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

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

  const loadStockHistory = async () => {
    try {
      setIsHistoryLoading(true);
      const movements = await listStockMovements({
        inventoryItemId: historyItemFilter !== "ALL" ? historyItemFilter : undefined,
        type: historyTypeFilter !== "ALL" ? historyTypeFilter : undefined,
        limit: 100,
      });
      setStockMovements(movements || []);
    } catch (err) {
      console.error("Error loading stock movements:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

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
        if (!adjustItemId) setAdjustItemId(items[0].id);
        if (!wastageItemId) setWastageItemId(items[0].id);
      }

      // Load Stock History if on History tab
      if (activeTab === "history") {
        await loadStockHistory();
      }
    } catch (err: any) {
      console.error("Error loading inventory:", err);
      if (!silent) toast.error("Failed to load inventory data");
    } finally {
      isFetchingRef.current = false;
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 25000);
    return () => clearInterval(interval);
  }, [selectedDate, selectedYear, selectedMonth, activeTab, historyTypeFilter, historyItemFilter]);

  const handleAddCategory = () => {
    if (!customCategoryName.trim()) return;
    const formattedCat = customCategoryName.trim();
    if (!categories.includes(formattedCat)) {
      setCategories((prev) => [...prev, formattedCat]);
    }
    setNewItemCategory(formattedCat);
    setCustomCategoryName("");
    setIsCreatingCategory(false);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newItemName.trim();
    if (!cleanName) {
      toast.error("Please provide an item name");
      return;
    }

    const qtyVal = parseFloat(newItemOnHand.replace(/[^0-9.]/g, "")) || 0;
    const costVal = parseFloat(newItemUnitCost.replace(/[^0-9.]/g, "")) || 0;

    if (isNaN(qtyVal) || qtyVal < 0 || qtyVal > 1_000_000) {
      toast.error("Initial stock quantity must be between 0 and 1,000,000");
      return;
    }

    if (isNaN(costVal) || costVal < 0 || costVal > 500_000) {
      toast.error("Unit cost must be between ₹0 and ₹500,000");
      return;
    }

    setIsSubmitting(true);
    try {
      await createInventoryItem({
        name: cleanName,
        category: newItemCategory.trim() || "General",
        quantity: qtyVal,
        unit: newItemUnit || "kg",
        unitCost: costVal,
        minReorderLevel: 10,
        inventoryType: newItemType,
      });

      toast.success(`Inventory item "${cleanName}" created successfully!`);
      setIsAddItemOpen(false);
      setNewItemName("");
      setNewItemUnitCost("");
      setNewItemOnHand("10");

      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create inventory item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItemId) {
      toast.error("Please select an inventory item to re-stock");
      return;
    }
    const targetItem = inventoryItems.find((i) => i.id === adjustItemId);
    if (!targetItem) return;

    const qtyChange = parseFloat(adjustQty);
    if (isNaN(qtyChange) || qtyChange === 0) {
      toast.error("Please enter a valid quantity change");
      return;
    }

    const newQuantity = targetItem.quantity + qtyChange;
    if (newQuantity < 0) {
      toast.error("Stock quantity cannot become negative");
      return;
    }

    setIsSubmitting(true);
    try {
      await adjustStock({
        inventoryItemId: adjustItemId,
        newQuantity,
        type: adjustType,
        reason: adjustReason.trim() || (adjustType === "PURCHASE" ? "Stock purchase" : "Stock adjustment"),
      });

      toast.success(adjustType === "PURCHASE" ? `Re-stocked ${targetItem.name} (+${qtyChange} ${targetItem.unit})` : "Stock adjusted successfully");
      setIsAddItemOpen(false);
      setAdjustQty("");
      setAdjustReason("");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to re-stock item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteInventoryItem(id);
      toast.success(`Deleted "${name}"`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item");
    }
  };

  const handleOpenCloseDay = () => {
    if (!dailyData || !dailyData.items) return;
    const initialCounts: { [key: string]: number } = {};
    dailyData.items.forEach((item: any) => {
      initialCounts[item.inventoryItemId] = item.systemClosing;
    });
    setClosePhysicalCounts(initialCounts);
    setIsCloseDayOpen(true);
  };

  const handleSubmitCloseDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyData || !dailyData.items) return;

    setIsSubmitting(true);
    try {
      const itemsPayload = dailyData.items.map((item: any) => ({
        inventoryItemId: item.inventoryItemId,
        actualPhysicalStock:
          closePhysicalCounts[item.inventoryItemId] !== undefined
            ? Number(closePhysicalCounts[item.inventoryItemId])
            : item.systemClosing,
      }));

      await closeDayInventory({
        dateStr: selectedDate,
        items: itemsPayload,
      });

      toast.success("Daily inventory successfully closed!");
      setIsCloseDayOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to close daily inventory");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        reason: wastageReason.trim() || "Manual wastage log",
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
      link.setAttribute("download", `inventory_report_${new Date().toISOString().slice(0, 10)}.csv`);
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
          <div className="design-section-label mb-3">COST CONTROL & LEDGER</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Inventory System
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time stock balance, daily shift log, and monthly inventory summaries.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => {
              if (inventoryItems.length > 0) setWastageItemId(inventoryItems[0].id);
              setIsWastageOpen(true);
            }}
            variant="outline"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer h-9"
          >
            <Flame className="w-4 h-4 text-rose-500" />
            <span>Record Wastage</span>
          </Button>

          {/* SINGLE UNIFIED ADD / RE-STOCK ITEM BUTTON */}
          <Button
            onClick={() => {
              setAddItemMode("new");
              setIsAddItemOpen(true);
            }}
            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 cursor-pointer h-9 border-none"
          >
            <Plus className="w-4 h-4" />
            <span>Add / Re-Stock Item</span>
          </Button>
        </div>
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
          <span>Live Stock ({inventoryItems.length})</span>
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
          <span>Daily Inventory Ledger</span>
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
          <span>Monthly Inventory Summary</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "history"
              ? "bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock Movement History</span>
        </button>
      </div>

      {/* TAB 1: CURRENT LIVE STOCK */}
      {activeTab === "current" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard
              label="INVENTORY TOTAL VALUE"
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
                  <span>Export CSV</span>
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ITEM</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">TRACKING TYPE</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STOCK</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">UNIT COST</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold w-48">STATUS</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 text-xs">
                {isLoading && inventoryItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading live stock telemetry...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                      No inventory items registered. Click &quot;Add / Re-Stock Item&quot; to create one.
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
                      <TableCell className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(item.id, item.name)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                <span className="text-xs font-semibold text-slate-500 block">Daily Shift Date</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {dailyData?.items?.some((i: any) => !i.isClosed) ? (
                <Button
                  onClick={handleOpenCloseDay}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 h-9"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Close Day Stock</span>
                </Button>
              ) : (
                <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-200">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Day Finalized & Closed</span>
                </div>
              )}
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
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-bold text-blue-600">SYSTEM CLOSING</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-bold text-slate-900">FINAL CLOSING</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 text-xs font-mono">
                {filteredDailyItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-400 font-sans">
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
                      <TableCell className="py-4 px-4 font-bold text-blue-700 bg-blue-50/40">{item.systemClosing.toFixed(2)} {item.unit}</TableCell>
                      <TableCell className="py-4 px-4 font-bold text-slate-900 bg-slate-50">
                        {item.isClosed ? `${item.closingStock} ${item.unit} (Closed)` : `${item.systemClosing.toFixed(2)} ${item.unit}`}
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

      {/* UNIFIED MODAL: ADD / RE-STOCK ITEM */}
      <Modal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        title="Add or Re-Stock Inventory"
        subtitle="Register a new product catalog item or record incoming purchases/stock additions."
      >
        <div className="space-y-4">
          {/* Mode Switcher Tabs Inside Modal */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setAddItemMode("new")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                addItemMode === "new"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <PackagePlus className="w-4 h-4" />
              <span>Register New Product</span>
            </button>

            <button
              type="button"
              onClick={() => setAddItemMode("restock")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                addItemMode === "restock"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Re-Stock Existing Item</span>
            </button>
          </div>

          {/* TAB MODE 1: REGISTER NEW PRODUCT */}
          {addItemMode === "new" && (
            <form onSubmit={handleCreateItem} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Name *
                </label>
                <Input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Fresh Paneer / Olive Oil / Tomatoes"
                  className="w-full px-3 py-2 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  {!isCreatingCategory ? (
                    <div className="flex gap-1.5">
                      <select
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreatingCategory(true)}
                        className="px-2 py-2 h-auto text-xs shrink-0 rounded-xl"
                        title="Add new category"
                      >
                        <FolderPlus className="w-4 h-4 text-blue-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <Input
                        type="text"
                        placeholder="New category..."
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl"
                      />
                      <Button
                        type="button"
                        onClick={handleAddCategory}
                        className="px-3 py-2 h-auto text-xs bg-blue-600 text-white rounded-xl"
                      >
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tracking Type *
                  </label>
                  <select
                    value={newItemType}
                    onChange={(e: any) => setNewItemType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                  >
                    <option value="DAILY">DAILY (Fresh / Perishable)</option>
                    <option value="MONTHLY">MONTHLY (Bulk / Dry Goods)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Stock *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={newItemOnHand}
                    onChange={(e) => setNewItemOnHand(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit *
                  </label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                    <option value="portions">portions</option>
                    <option value="bottles">bottles</option>
                    <option value="units">units</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Cost (₹)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItemUnitCost}
                    onChange={(e) => setNewItemUnitCost(e.target.value)}
                    placeholder="240.00"
                    className="w-full px-3 py-2 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddItemOpen(false)}
                  className="px-4 py-2 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs bg-[#0052ff] hover:bg-[#0046dc] text-white font-semibold rounded-xl"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save New Product"}
                </Button>
              </div>
            </form>
          )}

          {/* TAB MODE 2: RE-STOCK EXISTING PRODUCT */}
          {addItemMode === "restock" && (
            <form onSubmit={handleRestockSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Movement Type *</label>
                <select
                  value={adjustType}
                  onChange={(e: any) => setAdjustType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                >
                  <option value="PURCHASE">PURCHASE (New Shipment Received)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (Manual Correction)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Existing Item *</label>
                <select
                  value={adjustItemId}
                  onChange={(e) => setAdjustItemId(e.target.value)}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Added (+ / -) *</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. 5.00 for addition, -1.00 for reduction"
                  className="w-full px-3 py-2 text-xs rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Vendor Name</label>
                <Input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Received from FreshSupplies vendor"
                  className="w-full px-3 py-2 text-xs rounded-xl"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsAddItemOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-xl">
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Stock Addition"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Modal: Close Day Inventory */}
      <Modal
        isOpen={isCloseDayOpen}
        onClose={() => setIsCloseDayOpen(false)}
        title={`Close Day Inventory — ${selectedDate}`}
        subtitle="Compare actual physical stock against system closing balance. Discrepancies will log an automatic ADJUSTMENT movement."
      >
        <form onSubmit={handleSubmitCloseDay} className="space-y-4">
          <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
            {dailyData?.items?.map((item: any) => (
              <div key={item.inventoryItemId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{item.name}</span>
                  <span className="text-[11px] text-slate-500">
                    System Closing: <strong className="font-mono">{item.systemClosing.toFixed(2)} {item.unit}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={closePhysicalCounts[item.inventoryItemId] ?? item.systemClosing}
                    onChange={(e) =>
                      setClosePhysicalCounts((prev) => ({
                        ...prev,
                        [item.inventoryItemId]: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-24 h-9 text-xs rounded-lg font-mono text-right"
                  />
                  <span className="text-xs font-semibold text-slate-600">{item.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsCloseDayOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2 rounded-xl">
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Finalize & Close Day"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Wastage */}
      <Modal
        isOpen={isWastageOpen}
        onClose={() => setIsWastageOpen(false)}
        title="Record Stock Wastage"
        subtitle="Log spoiled, damaged, or expired ingredients to keep stock level accurate."
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
              placeholder="e.g. Expired, Spilled, Damaged package"
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
