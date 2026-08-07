"use client";

import React, { useState, useEffect, useMemo } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Download, TrendingUp, PieChart, Loader2, Utensils, Calendar } from "lucide-react";
import { toast } from "sonner";
import { getDailySales, getTopItems } from "@/actions/analytics";

export default function ReportsPage() {
  const [dateFilter, setDateFilter] = useState<"This Week" | "This Month" | "Last Month" | "Year to Date">("This Month");
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper: calculate DateRange based on dropdown selection
  const getDateRange = (filter: string) => {
    const now = new Date();
    const to = new Date(now);

    if (filter === "This Week") {
      const from = new Date(now);
      const day = from.getDay();
      const diff = from.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      from.setDate(diff);
      from.setHours(0, 0, 0, 0);
      return { from, to };
    }

    if (filter === "Last Month") {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { from, to: lastDay };
    }

    if (filter === "Year to Date") {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from, to };
    }

    // Default: "This Month"
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from, to };
  };

  // Load analytics telemetry from database
  const loadAnalyticsData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const range = getDateRange(dateFilter);

      const [salesRes, topRes] = await Promise.allSettled([
        getDailySales(range),
        getTopItems(range, 10),
      ]);

      const salesData = salesRes.status === "fulfilled" ? salesRes.value : [];
      const topData = topRes.status === "fulfilled" ? topRes.value : [];

      setDailySales(salesData || []);
      setTopItems(topData || []);
    } catch (err: any) {
      console.error("Error loading sales analytics:", err);
      if (!silent) toast.error(err.message || "Failed to load reporting telemetry");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();

    // 5-second polling interval for live sales synchronization
    const interval = setInterval(() => {
      loadAnalyticsData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [dateFilter]);

  // Aggregated Financial Metrics
  const totalRevenue = useMemo(() => {
    return dailySales.reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [dailySales]);

  const totalTax = useMemo(() => {
    return dailySales.reduce((acc, curr) => acc + (curr.tax || 0), 0);
  }, [dailySales]);

  const totalSubtotal = useMemo(() => {
    return dailySales.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
  }, [dailySales]);

  const totalCovers = useMemo(() => {
    return dailySales.reduce((acc, curr) => acc + (curr.count || 0), 0);
  }, [dailySales]);

  const averageCheck = useMemo(() => {
    return totalCovers > 0 ? totalRevenue / totalCovers : 0;
  }, [totalRevenue, totalCovers]);

  // Handle CSV Export
  const handleExportCSV = () => {
    if (dailySales.length === 0) {
      toast.error("No sales records available to export for selected range.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Orders Count,Subtotal (INR),GST Tax (INR),Total Revenue (INR),Average Check (INR)\n";

    dailySales.forEach((row) => {
      const avg = row.count > 0 ? (row.total / row.count).toFixed(2) : "0.00";
      csvContent += `${row.date},${row.count},${row.subtotal.toFixed(2)},${row.tax.toFixed(2)},${row.total.toFixed(2)},${avg}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales-report-${dateFilter.toLowerCase().replace(/\s+/g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Sales report exported successfully to CSV!");
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">FINANCIAL & SERVICE INSIGHTS</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Comprehensive sales, GST tax collections, and operational performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateFilter}
            onChange={(e: any) => setDateFilter(e.target.value)}
            className="px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer"
          >
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
            <option value="Year to Date">Year to Date</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="TOTAL REVENUE"
          value={isLoading ? "..." : `₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          subtext={`GST Tax Included: ₹${totalTax.toFixed(2)}`}
          trend={{ value: "Live Sales", isPositive: true }}
        />
        <StatCard
          label="TOTAL COVERS / ORDERS"
          value={isLoading ? "..." : `${totalCovers} Orders`}
          subtext="completed orders in range"
          trend={{ value: "Fulfilled", isPositive: true }}
        />
        <StatCard
          label="AVERAGE CHECK"
          value={isLoading ? "..." : `₹${averageCheck.toFixed(2)}`}
          subtext="revenue per order check"
          trend={{ value: "Average", isPositive: true }}
        />
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="design-surface p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Aggregating financial reports from database...</span>
        </div>
      )}

      {/* Visual Distribution Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Menu Items Breakdown (Phase 5) */}
          <div className="design-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-blue-600" />
                <span>Top Selling Menu Items</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">POPULAR DISHES</span>
            </div>

            <div className="space-y-3 pt-2">
              {topItems.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No menu item sales recorded for selected period.
                </div>
              ) : (
                topItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{item.name}</span>
                      <span className="text-slate-500 font-mono">{item.quantity} sold</span>
                    </div>
                    <span className="font-mono font-bold text-blue-600">₹{item.revenue.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cost Breakdown Card (Informational UI intact) */}
          <div className="design-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" />
                <span>Cost & Tax Breakdown</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">MARGIN TARGETS</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-mono text-slate-400 uppercase">GST Tax</div>
                <div className="text-lg font-bold text-slate-900 mt-1">₹{totalTax.toFixed(0)}</div>
                <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Calculated Tax</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Labour Cost</div>
                <div className="text-lg font-bold text-slate-900 mt-1">22.8%</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">On Target</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Net Margin</div>
                <div className="text-lg font-bold text-slate-900 mt-1">48.8%</div>
                <div className="text-[10px] text-blue-600 font-semibold mt-0.5">+3.2% vs target</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Performance Breakdown Table */}
      {!isLoading && (
        <div className="design-surface p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Daily Sales & Tax Ledger</h3>
            <span className="text-xs text-slate-400 font-mono">FILTER: {dateFilter.toUpperCase()}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">ORDERS</th>
                  <th className="py-3 px-4">SUBTOTAL (₹)</th>
                  <th className="py-3 px-4">GST TAX (₹)</th>
                  <th className="py-3 px-4">TOTAL REVENUE (₹)</th>
                  <th className="py-3 px-4">AVG CHECK (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-mono">
                {dailySales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      No sales records found for selected period.
                    </td>
                  </tr>
                ) : (
                  dailySales.map((row, idx) => {
                    const avg = row.count > 0 ? row.total / row.count : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-sans font-semibold text-slate-900">
                          {row.date}
                        </td>
                        <td className="py-4 px-4 text-slate-700">{row.count}</td>
                        <td className="py-4 px-4 text-slate-700">₹{row.subtotal.toFixed(2)}</td>
                        <td className="py-4 px-4 text-amber-600 font-semibold">₹{row.tax.toFixed(2)}</td>
                        <td className="py-4 px-4 text-slate-900 font-bold">₹{row.total.toFixed(2)}</td>
                        <td className="py-4 px-4 text-slate-700">₹{avg.toFixed(2)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
