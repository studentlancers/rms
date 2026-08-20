"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Users,
  Receipt,
  IndianRupee,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { getSuperAdminMetrics } from "@/actions/super-admin";
import { toast } from "sonner";

export default function SuperAdminDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const data = await getSuperAdminMetrics();
      setMetrics(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load platform metrics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs font-mono">Loading real-time platform telemetry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">PLATFORM DASHBOARD</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            System Overview & Metrics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time platform statistics, multi-tenant organization telemetry, and user management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/organizations"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer border-none"
          >
            <Building2 className="w-4 h-4" />
            <span>Manage Organizations</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="TOTAL RESTAURANTS"
          value={metrics.totalOrganizations}
          subtext={`${metrics.activeOrganizations} Active • ${metrics.inactiveOrganizations} Inactive`}
          trend={{ value: "Multi-Tenant", isPositive: true }}
        />

        <StatCard
          label="TOTAL PLATFORM USERS"
          value={metrics.totalUsers}
          subtext={`${metrics.totalOwners} Owners • ${metrics.totalAdmins} Admins • ${metrics.totalStaff} Staff`}
          trend={{ value: "Users", isPositive: true }}
        />

        <StatCard
          label="PLATFORM ORDERS"
          value={metrics.totalOrders}
          subtext="Total customer orders generated"
          trend={{ value: "Total POS", isPositive: true }}
        />

        <StatCard
          label="TOTAL PAID REVENUE"
          value={`₹${metrics.platformRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          subtext="Gross revenue across all restaurants"
          trend={{ value: "Platform Gross", isPositive: true }}
        />
      </div>

      {/* 2 Column Section: Recent Organizations & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Organizations */}
        <div className="design-surface p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Recent Organizations
              </h2>
            </div>
            <Link
              href="/super-admin/organizations"
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {metrics.recentOrganizations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No organizations found.</div>
            ) : (
              metrics.recentOrganizations.map((org: any) => (
                <div
                  key={org.id}
                  className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{org.name}</span>
                      <span className="text-[10px] font-mono text-blue-600 font-semibold">/{org.slug}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Owner: {org.ownerName} ({org.ownerEmail})
                    </div>
                  </div>

                  <div>
                    {org.isActive ? (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold font-mono rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold font-mono rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
                        INACTIVE
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Registered Users */}
        <div className="design-surface p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Recent Platform Registrations
              </h2>
            </div>
            <Link
              href="/super-admin/users"
              className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 font-semibold"
            >
              View directory <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {metrics.recentUsers.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No users found.</div>
            ) : (
              metrics.recentUsers.map((u: any) => (
                <div
                  key={u.id}
                  className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{u.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{u.email}</div>
                  </div>

                  <div className="px-2.5 py-1 text-[10px] font-bold font-mono rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                    {u.role || "user"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
