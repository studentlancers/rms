"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, Loader2, Building2, Receipt, IndianRupee, TrendingUp } from "lucide-react";
import { getSuperAdminReports } from "@/actions/super-admin";
import { toast } from "sonner";
import Link from "next/link";

export default function SuperAdminReportsPage() {
  const [reports, setReports] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const data = await getSuperAdminReports();
      setReports(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load platform reports");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs font-mono">Synthesizing platform revenue & tenant performance reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">SYSTEM TELEMETRY</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Platform Financial & Organization Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Aggregated multi-tenant performance leaderboard, total order throughput, and revenue analytics.
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="design-surface p-5 space-y-2">
          <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
            TOTAL GROSS REVENUE
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-600">
            ₹{reports.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 font-normal">Sum across all paid orders</div>
        </div>

        <div className="design-surface p-5 space-y-2">
          <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
            TOTAL POS ORDERS
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            {reports.totalOrders}
          </div>
          <div className="text-xs text-slate-500 font-normal">Orders processed platform-wide</div>
        </div>

        <div className="design-surface p-5 space-y-2">
          <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
            REGISTERED RESTAURANTS
          </div>
          <div className="text-3xl font-bold font-mono text-blue-600">
            {reports.totalOrganizations}
          </div>
          <div className="text-xs text-slate-500 font-normal">
            {reports.activeOrganizations} Active Tenants
          </div>
        </div>

        <div className="design-surface p-5 space-y-2">
          <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
            AVG REVENUE PER TENANT
          </div>
          <div className="text-3xl font-bold font-mono text-purple-600">
            ₹{reports.activeOrganizations > 0 ? (reports.totalRevenue / reports.activeOrganizations).toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "0"}
          </div>
          <div className="text-xs text-slate-500 font-normal">Average active tenant gross</div>
        </div>
      </div>

      {/* Organization Leaderboard Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
            Organization Revenue Leaderboard
          </h2>
        </div>

        <div className="design-surface rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">RANK</th>
                <th className="py-3.5 px-4 font-semibold">RESTAURANT NAME</th>
                <th className="py-3.5 px-4 font-semibold">TOTAL ORDERS</th>
                <th className="py-3.5 px-4 font-semibold text-right">TOTAL REVENUE (₹)</th>
                <th className="py-3.5 px-4 font-semibold">STATUS</th>
                <th className="py-3.5 px-4 font-semibold text-right">INSPECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.organizationReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No restaurant revenue records found.
                  </td>
                </tr>
              ) : (
                reports.organizationReports.map((org: any, index: number) => (
                  <tr key={org.restaurantId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-500">
                      #{index + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 text-sm">{org.name}</div>
                      <div className="text-[10px] font-mono text-blue-600 font-semibold">/{org.slug}</div>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-800">
                      {org.orderCount} orders
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-emerald-600">
                      ₹{org.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 font-mono text-[10px]">
                      {org.isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200/60 uppercase">
                          INACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/super-admin/organizations/${org.restaurantId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200/60 transition-colors"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
