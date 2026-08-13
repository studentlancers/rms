"use client";

import React, { useState, useEffect, useMemo } from "react";
import { StatCard } from "@/components/ui/stat-card";
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
import { Search, Download, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  listInventoryItems,
  getInventoryStats,
  exportInventoryCSV,
} from "@/actions/inventory";

export default function StaffInventoryPage() {
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

  // Backend Telemetry State
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalValue: "₹0.00",
    lowStockCount: "0",
    foodCostPercentage: "28.4%",
    totalItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Load Inventory Data from Server Actions
  const loadData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [items, currentStats] = await Promise.all([
        listInventoryItems(),
        getInventoryStats(),
      ]);

      setInventoryItems(items || []);
      setStats(currentStats);

      // Dynamically extract categories
      if (items && items.length > 0) {
        const dbCategories = Array.from(new Set(items.map((i: any) => i.category)));
        setCategories((prev) => Array.from(new Set([...prev, ...dbCategories])));
      }
    } catch (err: any) {
      console.error("Error loading staff inventory:", err);
      toast.error("Failed to load inventory telemetry");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 5-second polling for live shift updates
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header matching Owner Inventory */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">COST CONTROL (VIEW ONLY)</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track what is on hand, what is moving, and what needs action.
          </p>
        </div>
      </div>

      {/* Top 3 Stat Cards matching Owner Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="INVENTORY VALUE"
          value={isLoading ? "..." : stats.totalValue}
          subtext="live PostgreSQL database"
        />
        <StatCard
          label="LOW STOCK"
          value={isLoading ? "..." : stats.lowStockCount}
          subtext="items below reorder threshold"
        />
        <StatCard
          label="FOOD COST THIS MONTH"
          value={isLoading ? "..." : stats.foodCostPercentage}
          subtext="target efficiency metric"
        />
      </div>

      {/* Inventory Main Table Card matching Owner Inventory */}
      <div className="design-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
            <Input
              type="text"
              placeholder="Search inventory"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 h-9 bg-slate-50 border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer"
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
              className="flex items-center gap-1.5 px-3.5 py-2 h-9 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-slate-500" />}
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Data Table matching Owner Inventory */}
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ITEM</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STOCK</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">UNIT COST</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold w-48">STOCK LEVEL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-xs">
            {isLoading && inventoryItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-400 text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Loading inventory telemetry...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-400 text-xs">
                  No inventory items registered on floor.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-slate-50/80 transition-colors border-slate-100 group"
                >
                  <TableCell className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/60">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.category}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-4 font-semibold text-slate-800">
                    {item.onHandFormatted || `${item.quantity} ${item.unit}`}
                  </TableCell>

                  <TableCell className="py-4 px-4 text-slate-600 font-mono">
                    {item.unitCostFormatted || `₹${item.unitCost.toFixed(2)} / ${item.unit}`}
                  </TableCell>

                  <TableCell className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.status === "Low" || item.percentage <= 35 ? "bg-orange-500" : "bg-blue-600"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(15, item.percentage || 80))}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 w-8">
                        {item.percentage || 80}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
