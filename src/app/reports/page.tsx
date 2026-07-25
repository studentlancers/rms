"use client";

import React, { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Download, TrendingUp, PieChart } from "lucide-react";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("This Month");

  const reportsData = [
    { period: "Feb 01 - Feb 07", covers: 1120, revenue: "₹42,860", avgCheck: "₹38.26", foodCost: "27.8%" },
    { period: "Jan 25 - Jan 31", covers: 1080, revenue: "₹40,120", avgCheck: "₹37.14", foodCost: "28.1%" },
    { period: "Jan 18 - Jan 24", covers: 1150, revenue: "₹44,500", avgCheck: "₹38.69", foodCost: "28.5%" },
    { period: "Jan 11 - Jan 17", covers: 1470, revenue: "₹56,810", avgCheck: "₹38.64", foodCost: "27.2%" },
  ];

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
            Comprehensive sales, cover counts, and operational performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors focus:outline-none"
          >
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
            <option value="Year to Date">Year to Date</option>
          </select>

          <button
            onClick={() => alert("Downloading full performance PDF report...")}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="MONTHLY REVENUE"
          value="₹184,290"
          subtext="↗ 14.2% vs last month"
          trend={{ value: "↗ +14.2%", isPositive: true }}
        />
        <StatCard
          label="TOTAL COVERS"
          value="4,820"
          subtext="↗ 8.4% growth"
          trend={{ value: "↗ +8.4%", isPositive: true }}
        />
        <StatCard
          label="REVPAR"
          value="₹38.20"
          subtext="↗ 5.1% efficiency"
          trend={{ value: "↗ +5.1%", isPositive: true }}
        />
      </div>

      {/* Visual Distribution Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="design-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Revenue by Day Part</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">LUNCH VS DINNER</span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1.5">
                <span>Dinner Service (5:00 PM – 10:30 PM)</span>
                <span className="font-mono text-blue-600">₹118,340 (64%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full w-[64%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1.5">
                <span>Lunch Service (11:30 AM – 3:00 PM)</span>
                <span className="font-mono text-emerald-600">₹65,950 (36%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[36%]" />
              </div>
            </div>
          </div>
        </div>

        <div className="design-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <span>Cost Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">MARGIN TARGETS</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Food Cost</div>
              <div className="text-lg font-bold text-slate-900 mt-1">28.4%</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Under 30% Target</div>
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

      {/* Weekly Breakdown Table */}
      <div className="design-surface p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Weekly Performance Breakdown</h3>
          <span className="text-xs text-slate-400 font-mono">PAST 4 WEEKS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                <th className="py-3 px-4">PERIOD</th>
                <th className="py-3 px-4">COVERS</th>
                <th className="py-3 px-4">TOTAL REVENUE</th>
                <th className="py-3 px-4">AVG CHECK</th>
                <th className="py-3 px-4">FOOD COST %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono">
              {reportsData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 font-sans font-semibold text-slate-900">
                    {row.period}
                  </td>
                  <td className="py-4 px-4 text-slate-700">{row.covers}</td>
                  <td className="py-4 px-4 text-slate-900 font-bold">{row.revenue}</td>
                  <td className="py-4 px-4 text-slate-700">{row.avgCheck}</td>
                  <td className="py-4 px-4 text-emerald-600 font-semibold">{row.foodCost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
