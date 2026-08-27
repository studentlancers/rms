"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StatCard } from "@/components/ui/stat-card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import { getDailySales } from "@/actions/analytics";

export default function OverviewPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "restaurant";
  // Modal state
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);

  // Analytics Data State
  const [weeklySales, setWeeklySales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch 7-day sales telemetry for overview chart and stat cards
  const loadOverviewAnalytics = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const now = new Date();
      const from = new Date(now);
      from.setDate(now.getDate() - 6);
      from.setHours(0, 0, 0, 0);

      const sales = await getDailySales({ from, to: now });
      setWeeklySales(sales || []);
    } catch (err: any) {
      console.error("Error loading overview analytics:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverviewAnalytics();

    // 5-second polling for live dashboard synchronization
    const interval = setInterval(() => {
      loadOverviewAnalytics(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Today's Sales Metrics
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = useMemo(() => {
    return weeklySales.find((s) => s.date === todayStr) || { total: 0, count: 0, subtotal: 0, tax: 0 };
  }, [weeklySales, todayStr]);

  const salesToday = todayRecord.total || 0;
  const coversToday = todayRecord.count || 0;
  const avgCheckToday = coversToday > 0 ? salesToday / coversToday : 0;

  // 7-Day Revenue Total
  const weeklyTotalRevenue = useMemo(() => {
    return weeklySales.reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [weeklySales]);

  // Dynamic Chart Points Generator
  const chartPoints = useMemo(() => {
    const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const maxVal = Math.max(...weeklySales.map((s) => s.total), 1000);

    return days.map((dayLabel, idx) => {
      const record = weeklySales[idx] || { total: 0 };
      const heightPercent = (record.total / maxVal) * 80;
      return {
        label: dayLabel,
        total: record.total,
        heightPercent: Math.max(heightPercent, 10),
      };
    });
  }, [weeklySales]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">LIVE SERVICE</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Welcome back to RMS.
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here&apos;s how your restaurant is performing today.
          </p>
        </div>
      </div>

      {/* Top 3 Stat Cards (Phase 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="SALES TODAY"
          value={isLoading ? "..." : `₹${salesToday.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          subtext="live sales volume"
          trend={{ value: "Live POS", isPositive: true }}
        />
        <StatCard
          label="COVERS SERVED TODAY"
          value={isLoading ? "..." : `${coversToday} Orders`}
          subtext="completed orders"
          trend={{ value: "Fulfilled", isPositive: true }}
        />
        <StatCard
          label="AVERAGE CHECK TODAY"
          value={isLoading ? "..." : `₹${avgCheckToday.toFixed(2)}`}
          subtext="average ticket size"
          trend={{ value: "Average", isPositive: true }}
        />
      </div>

      {/* Middle Row: Revenue Performance Chart + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Dynamic Revenue Performance Bar/Wave Chart (Phase 4) */}
        <div className="lg:col-span-2 design-surface p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                7-DAY REVENUE PERFORMANCE
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold tracking-tight text-slate-900">
                  ₹{weeklyTotalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                  Live Database
                </span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="relative h-48 w-full pt-4 flex items-end justify-between gap-3 px-2">
            {chartPoints.map((pt, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  ₹{pt.total.toFixed(0)}
                </span>
                <div
                  style={{ height: `${pt.heightPercent}%` }}
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 shadow-sm"
                />
                <span className="text-[10px] font-mono font-semibold text-slate-400">
                  {pt.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence Card */}
        <div className="design-inverted-section design-dot-grid p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden border border-slate-800 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 rounded-xl bg-slate-800/90 text-blue-400 flex items-center justify-center border border-slate-700">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-semibold tracking-widest text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-800/40">
                MISE INTELLIGENCE
              </span>
            </div>

            <h3 className="font-display text-2xl font-semibold text-white leading-tight mt-2">
              Your service is operating{" "}
              <span className="text-[#4d7cff]">smoothly.</span>
            </h3>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Order volume is synchronized across POS, Kitchen, and Delivery consoles.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-slate-400 tracking-wider">
                TODAY&apos;S TOTAL SALES
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                ₹{salesToday.toFixed(2)}
              </div>
            </div>

            <button
              onClick={() => setIsInsightsModalOpen(true)}
              className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold px-4 py-2 rounded-full transition-all shadow-sm cursor-pointer border-none"
            >
              View insights
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: System Health */}
      <div className="design-surface p-6 flex flex-col justify-between">
        <div>
          <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase mb-1">
            SYSTEM STATUS
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            All 8 Operational Modules Integrated
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Menu Management, Orders POS, Kitchen Display, Billing, Platform, Tables, Delivery, and Staff modules are running on live PostgreSQL database telemetry.
          </p>
        </div>
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Last synced: <strong className="text-slate-700">Just now</strong></span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            All Systems Operational
          </span>
        </div>
      </div>

      {/* Modal: Intelligence Insights */}
      <Modal
        isOpen={isInsightsModalOpen}
        onClose={() => setIsInsightsModalOpen(false)}
        title="Mise Intelligence Analysis"
        subtitle="AI Service Forecast & Demand Insights"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50/60 border border-blue-200/60 rounded-xl text-xs text-blue-900 space-y-2">
            <div className="font-semibold text-blue-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Service Peak Telemetry</span>
            </div>
            <p>
              Live revenue tracking shows stable ticket sizes. All order items are automatically logged to PostgreSQL.
            </p>
          </div>

          <div className="pt-3 flex justify-end">
            <Button
              onClick={() => setIsInsightsModalOpen(false)}
              className="px-4 py-2 h-9 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl border-none cursor-pointer"
            >
              Close Insights
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
