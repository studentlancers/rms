"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  Receipt,
  IndianRupee,
  Utensils,
  LayoutGrid,
  Calendar,
  Truck,
  Package,
  TrendingDown,
  Sparkles,
  Settings,
  Eye,
  Search,
  Filter,
  ShieldCheck,
  Tag,
  AlertTriangle,
  RefreshCw,
  Clock,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getSuperAdminRestaurantOverview,
  getSuperAdminRestaurantOrders,
  getSuperAdminRestaurantMenu,
  getSuperAdminRestaurantTablesAndReservations,
  getSuperAdminRestaurantStaff,
  getSuperAdminRestaurantDelivery,
  getSuperAdminRestaurantInventory,
  getSuperAdminRestaurantExpenses,
  getSuperAdminRestaurantSpecials,
  getSuperAdminRestaurantSettings,
} from "@/actions/super-admin";

type TabType =
  | "overview"
  | "orders"
  | "menu"
  | "tables"
  | "staff"
  | "delivery"
  | "inventory"
  | "expenses"
  | "specials"
  | "settings";

export default function SuperAdminRestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = (params?.organizationId as string) || "";

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tab-specific state data
  const [tabData, setTabData] = useState<Record<string, any>>({});
  const [loadingTabs, setLoadingTabs] = useState<Record<string, boolean>>({});

  // Orders tab filter & pagination
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersStatusFilter, setOrdersStatusFilter] = useState("ALL");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Expenses tab pagination
  const [expensesPage, setExpensesPage] = useState(1);

  // Initial Load of Overview Data
  const loadOverview = async () => {
    if (!organizationId) return;
    try {
      setIsLoadingOverview(true);
      setErrorMessage(null);
      const data = await getSuperAdminRestaurantOverview(organizationId);
      setOverviewData(data);
    } catch (err: any) {
      console.error("Error loading restaurant overview:", err);
      setErrorMessage(err.message || "Failed to load restaurant overview");
      toast.error(err.message || "Failed to load restaurant details");
    } finally {
      setIsLoadingOverview(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [organizationId]);

  // Tab change & lazy loading handler
  const handleTabChange = async (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "overview") return;

    if (!tabData[tab] || tab === "orders" || tab === "expenses") {
      await fetchTabData(tab);
    }
  };

  const fetchTabData = async (tab: TabType) => {
    setLoadingTabs((prev) => ({ ...prev, [tab]: true }));
    try {
      let data: any = null;

      switch (tab) {
        case "orders":
          data = await getSuperAdminRestaurantOrders(
            organizationId,
            ordersPage,
            ordersStatusFilter
          );
          break;
        case "menu":
          data = await getSuperAdminRestaurantMenu(organizationId);
          break;
        case "tables":
          data = await getSuperAdminRestaurantTablesAndReservations(organizationId);
          break;
        case "staff":
          data = await getSuperAdminRestaurantStaff(organizationId);
          break;
        case "delivery":
          data = await getSuperAdminRestaurantDelivery(organizationId);
          break;
        case "inventory":
          data = await getSuperAdminRestaurantInventory(organizationId);
          break;
        case "expenses":
          data = await getSuperAdminRestaurantExpenses(organizationId, expensesPage);
          break;
        case "specials":
          data = await getSuperAdminRestaurantSpecials(organizationId);
          break;
        case "settings":
          data = await getSuperAdminRestaurantSettings(organizationId);
          break;
      }

      setTabData((prev) => ({ ...prev, [tab]: data }));
    } catch (err: any) {
      console.error(`Error loading tab ${tab}:`, err);
      toast.error(err.message || `Failed to load ${tab} data`);
    } finally {
      setLoadingTabs((prev) => ({ ...prev, [tab]: false }));
    }
  };

  // Re-fetch orders on pagination / status filter change
  useEffect(() => {
    if (activeTab === "orders") {
      fetchTabData("orders");
    }
  }, [ordersPage, ordersStatusFilter]);

  // Re-fetch expenses on pagination change
  useEffect(() => {
    if (activeTab === "expenses") {
      fetchTabData("expenses");
    }
  }, [expensesPage]);

  // Format currency helper
  const fmtInr = (amt: number) => {
    return `₹${Number(amt || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (isLoadingOverview) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0052ff]" />
        <span className="text-xs font-mono">Loading restaurant telemetry & profile...</span>
      </div>
    );
  }

  if (errorMessage || !overviewData) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to Load Restaurant</h2>
        <p className="text-xs text-slate-500 font-mono">{errorMessage || "Restaurant organization not found."}</p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            href="/super-admin/organizations"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full border border-slate-200"
          >
            Back to Organizations
          </Link>
          <Button
            onClick={loadOverview}
            className="px-4 py-2 bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold rounded-full border-none cursor-pointer"
          >
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  const { profile, performance, menuStats, tablesStats, reservationStats, inventoryStats, expenseStats, deliveryStats, recentActivity } = overviewData;

  const tabsList: Array<{ id: TabType; label: string; icon: any }> = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "orders", label: "Orders", icon: Receipt },
    { id: "menu", label: "Menu", icon: Utensils },
    { id: "tables", label: "Tables & Reservations", icon: LayoutGrid },
    { id: "staff", label: "Staff", icon: Users },
    { id: "delivery", label: "Delivery", icon: Truck },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "expenses", label: "Expenses", icon: TrendingDown },
    { id: "specials", label: "Daily Specials", icon: Sparkles },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Sleek Hero Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Top Breadcrumb & Badge Row */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/super-admin/organizations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0052ff] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Organizations
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0052ff] text-[11px] font-semibold border border-blue-200/60 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0052ff]" />
            <span>Super Admin Read-Only Inspection</span>
          </div>
        </div>

        {/* Restaurant Identity & Details */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0052ff] to-indigo-600 text-white font-display font-bold text-2xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              {profile.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
                  {profile.name}
                </h1>
                {profile.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ACTIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" /> SUSPENDED
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-mono">
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">/{profile.slug}</span>
                <span>•</span>
                <span>ID: <code className="text-slate-800 font-semibold">{profile.id}</code></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600">
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">RESTAURANT OWNER</div>
              <div className="font-semibold text-slate-900">{profile.ownerName}</div>
              <div className="text-[11px] text-slate-500">{profile.ownerEmail}</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">MEMBERSHIP</div>
              <div className="font-semibold text-slate-900">{profile.totalMembers} Members</div>
              <div className="text-[11px] text-slate-500">{profile.adminCount} Admins • {profile.staffCount} Staff</div>
            </div>
          </div>
        </div>

        {/* Clean Segmented Tab Navigation Bar */}
        <div className="pt-3 border-t border-slate-100">
          <div className="bg-slate-100/80 p-1.5 rounded-xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-slate-200/60">
            {tabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer border-none",
                    isActive
                      ? "bg-white text-[#0052ff] shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-[#0052ff]" : "text-slate-400")} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Financial Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>TOTAL GROSS REVENUE</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">PAID</span>
              </div>
              <div className="text-2xl font-bold font-sans text-slate-900">{fmtInr(performance.totalRevenue)}</div>
              <div className="text-[11px] text-slate-400">Total revenue across paid POS orders</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>TODAY&apos;S REVENUE</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">TODAY</span>
              </div>
              <div className="text-2xl font-bold font-sans text-slate-900">{fmtInr(performance.todayRevenue)}</div>
              <div className="text-[11px] text-slate-400">{performance.todayOrders} orders processed today</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>MONTHLY REVENUE</span>
                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold">THIS MONTH</span>
              </div>
              <div className="text-2xl font-bold font-sans text-slate-900">{fmtInr(performance.monthRevenue)}</div>
              <div className="text-[11px] text-slate-400">Current month gross revenue</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>AVERAGE TICKET / CHECK</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">AVG</span>
              </div>
              <div className="text-2xl font-bold font-sans text-slate-900">{fmtInr(performance.avgOrderValue)}</div>
              <div className="text-[11px] text-slate-400">{performance.completedOrders} completed orders</div>
            </div>
          </div>

          {/* Operational Domain Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">ORDERS</span>
                <Receipt className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="text-xl font-bold text-slate-900">{performance.totalOrders}</div>
              <div className="text-[11px] text-slate-500">{performance.activeOrders} active • {performance.cancelledOrders} cancelled</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">MENU ITEMS</span>
                <Utensils className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-xl font-bold text-slate-900">{menuStats.totalMenuItems}</div>
              <div className="text-[11px] text-slate-500">{menuStats.availableItems} avail • {menuStats.soldOutItems} sold out</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">TABLES</span>
                <LayoutGrid className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="text-xl font-bold text-slate-900">{tablesStats.totalTables}</div>
              <div className="text-[11px] text-emerald-600 font-medium">{tablesStats.freeTables} free • {tablesStats.occupiedTables} occupied</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">RESERVATIONS</span>
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="text-xl font-bold text-slate-900">{reservationStats.totalReservations}</div>
              <div className="text-[11px] text-slate-500">{reservationStats.todayReservations} today • {reservationStats.pendingReservations} pending</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">INVENTORY</span>
                <Package className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-xl font-bold text-slate-900">{inventoryStats.totalItems}</div>
              <div className="text-[11px] text-rose-600 font-medium">{inventoryStats.lowStockCount} low stock</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">EXPENSES</span>
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-xl font-bold text-rose-600">{fmtInr(expenseStats.totalExpenses)}</div>
              <div className="text-[11px] text-slate-500">Gen: {fmtInr(expenseStats.generalExpenses)}</div>
            </div>
          </div>

          {/* Activity Feeds Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Recent Orders Activity</h3>
                </div>
                <button
                  onClick={() => handleTabChange("orders")}
                  className="text-xs text-[#0052ff] hover:underline font-semibold cursor-pointer border-none bg-transparent"
                >
                  View all orders →
                </button>
              </div>

              {recentActivity.recentOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  No orders recorded for this restaurant yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.recentOrders.map((ord: any) => (
                    <div key={ord.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">#ORD-{ord.id.slice(-4).toUpperCase()} ({ord.orderType})</div>
                        <div className="text-[11px] text-slate-500 font-mono">{new Date(ord.createdAt).toLocaleTimeString([], { timeStyle: "short" })} • Table {ord.table?.tableNumber || "N/A"}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">{fmtInr(ord.total)}</div>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">{ord.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Reservations Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Recent Reservations</h3>
                </div>
                <button
                  onClick={() => handleTabChange("tables")}
                  className="text-xs text-[#0052ff] hover:underline font-semibold cursor-pointer border-none bg-transparent"
                >
                  View all reservations →
                </button>
              </div>

              {recentActivity.recentReservations.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  No reservations recorded for this restaurant yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.recentReservations.map((res: any) => (
                    <div key={res.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{res.customerName} ({res.partySize} Pax)</div>
                        <div className="text-[11px] text-slate-500 font-mono">{new Date(res.reservationTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</div>
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {res.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ORDERS */}
      {/* ========================================================================= */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#0052ff]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">Restaurant Orders</h2>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={ordersStatusFilter}
                onChange={(e) => setOrdersStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2 focus:border-[#0052ff] font-mono shadow-2xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="PREPARING">PREPARING</option>
                <option value="READY">READY</option>
                <option value="SERVED">SERVED</option>
                <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {loadingTabs.orders ? (
            <div className="flex justify-center p-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#0052ff]" />
            </div>
          ) : !tabData.orders || tabData.orders.orders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl text-xs">
              No orders found matching the filter criteria.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">ORDER ID</th>
                    <th className="py-3.5 px-4 font-semibold">TYPE</th>
                    <th className="py-3.5 px-4 font-semibold">TABLE</th>
                    <th className="py-3.5 px-4 font-semibold">CUSTOMER</th>
                    <th className="py-3.5 px-4 font-semibold text-right">TOTAL</th>
                    <th className="py-3.5 px-4 font-semibold">PAYMENT</th>
                    <th className="py-3.5 px-4 font-semibold">STATUS</th>
                    <th className="py-3.5 px-4 font-semibold">DATE</th>
                    <th className="py-3.5 px-4 font-semibold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tabData.orders.orders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        #ORD-{ord.id.slice(-4).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {ord.orderType}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {ord.table ? `T-${ord.table.tableNumber}` : "N/A"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{ord.customerName || "Walk-in Guest"}</div>
                        {ord.customerPhone && <div className="text-[10px] font-mono text-slate-500">{ord.customerPhone}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                        {fmtInr(ord.total)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px]">
                        {ord.paymentStatus === "PAID" ? (
                          <span className="text-emerald-700 font-bold">PAID</span>
                        ) : (
                          <span className="text-amber-700 font-bold">{ord.paymentStatus}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px]">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold uppercase">
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {new Date(ord.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedOrderDetails(ord);
                            setIsOrderModalOpen(true);
                          }}
                          className="h-7 px-3 text-[11px] text-[#0052ff] hover:bg-blue-50 border border-blue-200/60 rounded-full cursor-pointer"
                        >
                          <Eye className="w-3 h-3 mr-1" /> View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
                <span>Page {tabData.orders.page} of {tabData.orders.totalPages} ({tabData.orders.totalCount} total orders)</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={ordersPage <= 1}
                    onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-3 text-xs text-slate-700 border border-slate-200 rounded-full"
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={ordersPage >= tabData.orders.totalPages}
                    onClick={() => setOrdersPage((p) => p + 1)}
                    className="h-8 px-3 text-xs text-slate-700 border border-slate-200 rounded-full"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MENU */}
      {/* ========================================================================= */}
      {activeTab === "menu" && (
        <div className="space-y-6">
          {loadingTabs.menu ? (
            <div className="flex justify-center p-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#0052ff]" />
            </div>
          ) : !tabData.menu ? (
            <div className="p-8 text-center text-slate-500">Failed to load menu data.</div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
                    Menu Catalog ({tabData.menu.menuItems.length} items across {tabData.menu.categories.length} categories)
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  READ ONLY VIEW
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">ITEM NAME</th>
                      <th className="py-3 px-4 font-semibold">CATEGORY</th>
                      <th className="py-3 px-4 font-semibold text-right">PRICE</th>
                      <th className="py-3 px-4 font-semibold">DIETARY</th>
                      <th className="py-3 px-4 font-semibold">AVAILABILITY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tabData.menu.menuItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>{item.name}</div>
                          {item.description && <div className="text-[10px] text-slate-500 font-normal">{item.description}</div>}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {item.category?.name || "General"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                          {fmtInr(item.price)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px]">
                          {item.isVeg ? (
                            <span className="text-emerald-700 font-bold">VEG 🌱</span>
                          ) : (
                            <span className="text-rose-700 font-bold">NON-VEG 🍖</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px]">
                          {item.isAvailable ? (
                            <span className="text-emerald-700 font-bold">AVAILABLE</span>
                          ) : (
                            <span className="text-rose-700 font-bold">SOLD OUT</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TABLES & RESERVATIONS */}
      {/* ========================================================================= */}
      {activeTab === "tables" && (
        <div className="space-y-8">
          {loadingTabs.tables ? (
            <div className="flex justify-center p-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#0052ff]" />
            </div>
          ) : !tabData.tables ? (
            <div className="p-8 text-center text-slate-500">Failed to load tables data.</div>
          ) : (
            <div className="space-y-8">
              {/* Floor Plan Tables Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-[#0052ff]" /> Floor Tables ({tabData.tables.tables.length})
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {tabData.tables.tables.map((t: any) => (
                    <div key={t.id} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 font-mono">T-{t.tableNumber}</span>
                        <span className="text-[10px] text-slate-500">{t.capacity} Seats</span>
                      </div>
                      <div className="text-[10px] font-mono font-bold uppercase">
                        {t.status === "FREE" && <span className="text-emerald-600">FREE</span>}
                        {t.status === "OCCUPIED" && <span className="text-rose-600">OCCUPIED</span>}
                        {t.status === "RESERVED" && <span className="text-amber-600">RESERVED</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reservations List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" /> Reservations ({tabData.tables.reservations.length})
                </h3>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">CUSTOMER</th>
                        <th className="py-3 px-4 font-semibold">PHONE</th>
                        <th className="py-3 px-4 font-semibold">PARTY SIZE</th>
                        <th className="py-3 px-4 font-semibold">TIME</th>
                        <th className="py-3 px-4 font-semibold">ASSIGNED TABLE</th>
                        <th className="py-3 px-4 font-semibold">STATUS</th>
                        <th className="py-3 px-4 font-semibold">TAKEN BY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tabData.tables.reservations.map((r: any) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{r.customerName}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">{r.customerPhone}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">{r.partySize} Pax</td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">
                            {new Date(r.reservationTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">
                            {r.table ? `T-${r.table.tableNumber}` : "Unassigned"}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px]">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase font-bold">
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">{r.takenByName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: STAFF */}
      {/* ========================================================================= */}
      {activeTab === "staff" && (
        <div className="space-y-6">
          {loadingTabs.staff ? (
            <div className="flex justify-center p-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#0052ff]" />
            </div>
          ) : !tabData.staff ? (
            <div className="p-8 text-center text-slate-500">Failed to load staff roster.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">Restaurant Staff Roster ({tabData.staff.length} members)</h2>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">MEMBER NAME</th>
                      <th className="py-3 px-4 font-semibold">EMAIL ADDRESS</th>
                      <th className="py-3 px-4 font-semibold">ORGANIZATION ROLE</th>
                      <th className="py-3 px-4 font-semibold">JOINED DATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tabData.staff.map((m: any) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{m.name}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{m.email}</td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                            {m.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {new Date(m.joinedAt).toLocaleDateString([], { dateStyle: "medium" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: DELIVERY */}
      {/* ========================================================================= */}
      {activeTab === "delivery" && (
        <div className="space-y-6">
          {loadingTabs.delivery ? (
            <div className="flex justify-center p-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#0052ff]" />
            </div>
          ) : !tabData.delivery || tabData.delivery.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl text-xs">
              No delivery orders recorded for this restaurant.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">ORDER ID</th>
                    <th className="py-3 px-4 font-semibold">RIDER NAME</th>
                    <th className="py-3 px-4 font-semibold">STATUS</th>
                    <th className="py-3 px-4 font-semibold">ETA</th>
                    <th className="py-3 px-4 font-semibold">CREATED</th>
                    <th className="py-3 px-4 font-semibold">DELIVERED</th>
                    <th className="py-3 px-4 font-semibold text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tabData.delivery.map((d: any) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">#ORD-{d.orderId.slice(-4).toUpperCase()}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{d.riderName}</td>
                      <td className="py-3.5 px-4 font-mono text-[10px]">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 font-bold uppercase">
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{d.etaMinutes ? `${d.etaMinutes} mins` : "N/A"}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{new Date(d.createdAt).toLocaleTimeString([], { timeStyle: "short" })}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{d.deliveredAt ? new Date(d.deliveredAt).toLocaleTimeString([], { timeStyle: "short" }) : "In progress"}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">{fmtInr(d.order?.total || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: INVENTORY */}
      {/* ========================================================================= */}
      {activeTab === "inventory" && (
        <div className="space-y-8">
          {loadingTabs.inventory ? (
            <div className="flex justify-center p-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#0052ff]" />
            </div>
          ) : !tabData.inventory ? (
            <div className="p-8 text-center text-slate-500">Failed to load inventory data.</div>
          ) : (
            <div className="space-y-8">
              {/* Inventory Items List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" /> Inventory Stock Items ({tabData.inventory.inventoryItems.length})
                </h3>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">ITEM NAME</th>
                        <th className="py-3 px-4 font-semibold">CATEGORY</th>
                        <th className="py-3 px-4 font-semibold">CURRENT STOCK</th>
                        <th className="py-3 px-4 font-semibold text-right">UNIT COST</th>
                        <th className="py-3 px-4 font-semibold">REORDER LEVEL</th>
                        <th className="py-3 px-4 font-semibold">STATUS</th>
                        <th className="py-3 px-4 font-semibold">SUPPLIER</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tabData.inventory.inventoryItems.map((item: any) => {
                        const isLow = item.quantity <= item.minReorderLevel;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-600">{item.category}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{item.quantity} {item.unit}</td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">{fmtInr(item.unitCost)}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-500">{item.minReorderLevel} {item.unit}</td>
                            <td className="py-3.5 px-4 font-mono text-[10px]">
                              {isLow ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 font-bold">LOW STOCK</span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold">HEALTHY</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-500">{item.supplier?.name || "N/A"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stock Movements List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-600" /> Recent Stock Movements
                </h3>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">ITEM</th>
                        <th className="py-3 px-4 font-semibold">CHANGE</th>
                        <th className="py-3 px-4 font-semibold">TYPE</th>
                        <th className="py-3 px-4 font-semibold">REASON</th>
                        <th className="py-3 px-4 font-semibold">DATE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tabData.inventory.stockMovements.map((sm: any) => (
                        <tr key={sm.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{sm.inventoryItem?.name || "Item"}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{sm.quantityChange > 0 ? `+${sm.quantityChange}` : sm.quantityChange}</td>
                          <td className="py-3.5 px-4 font-mono text-[10px]">
                            <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase font-bold">{sm.type}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">{sm.reason || "N/A"}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">{new Date(sm.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: EXPENSES */}
      {/* ========================================================================= */}
      {activeTab === "expenses" && (
        <div className="space-y-6">
          {loadingTabs.expenses ? (
            <div className="flex justify-center p-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#0052ff]" />
            </div>
          ) : !tabData.expenses ? (
            <div className="p-8 text-center text-slate-500">Failed to load expense data.</div>
          ) : (
            <div className="space-y-6">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase">GROSS REVENUE</div>
                  <div className="text-2xl font-bold font-sans text-emerald-600">{fmtInr(tabData.expenses.summary.grossRevenue)}</div>
                  <div className="text-[11px] text-slate-400">Paid POS transactions</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase">TOTAL EXPENSES</div>
                  <div className="text-2xl font-bold font-sans text-rose-600">{fmtInr(tabData.expenses.summary.totalExpenses)}</div>
                  <div className="text-[11px] text-slate-400">General & Inventory costs</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase">GENERAL vs INVENTORY</div>
                  <div className="text-sm font-bold font-mono text-slate-800">{fmtInr(tabData.expenses.summary.generalExpenses)} / {fmtInr(tabData.expenses.summary.inventoryExpenses)}</div>
                  <div className="text-[11px] text-slate-400">Expense breakdown</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase">NET MARGIN</div>
                  <div className={cn("text-2xl font-bold font-sans", tabData.expenses.summary.netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {fmtInr(tabData.expenses.summary.netProfit)}
                  </div>
                  <div className="text-[11px] text-slate-400">Revenue - Expenses</div>
                </div>
              </div>

              {/* Expenses Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">EXPENSE NAME</th>
                      <th className="py-3 px-4 font-semibold">TYPE</th>
                      <th className="py-3 px-4 font-semibold">STAFF TAG</th>
                      <th className="py-3 px-4 font-semibold">SUPPLIER</th>
                      <th className="py-3 px-4 font-semibold text-right">AMOUNT</th>
                      <th className="py-3 px-4 font-semibold">DATE</th>
                      <th className="py-3 px-4 font-semibold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tabData.expenses.expenses.map((exp: any) => (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>{exp.name}</div>
                          {(exp.description || exp.productName) && <div className="text-[10px] text-slate-500 font-normal">{exp.description || exp.productName}</div>}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px]">
                          <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase font-bold">{exp.type}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{exp.staffUser?.name || "N/A"}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{exp.supplierName || exp.supplier?.name || "N/A"}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">{fmtInr(exp.amount)}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{new Date(exp.date).toLocaleDateString([], { dateStyle: "medium" })}</td>
                        <td className="py-3.5 px-4 font-mono text-[10px]">
                          <span className="text-emerald-600 font-bold uppercase">{exp.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>Page {tabData.expenses.page} of {tabData.expenses.totalPages} ({tabData.expenses.totalCount} total expense records)</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={expensesPage <= 1}
                      onClick={() => setExpensesPage((p) => Math.max(1, p - 1))}
                      className="h-8 px-3 text-xs text-slate-700 border border-slate-200 rounded-full"
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={expensesPage >= tabData.expenses.totalPages}
                      onClick={() => setExpensesPage((p) => p + 1)}
                      className="h-8 px-3 text-xs text-slate-700 border border-slate-200 rounded-full"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: DAILY SPECIALS */}
      {/* ========================================================================= */}
      {activeTab === "specials" && (
        <div className="space-y-6">
          {loadingTabs.specials ? (
            <div className="flex justify-center p-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#0052ff]" />
            </div>
          ) : !tabData.specials || tabData.specials.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl text-xs">
              No daily specials currently configured for this restaurant.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">DISH NAME</th>
                    <th className="py-3 px-4 font-semibold">CATEGORY</th>
                    <th className="py-3 px-4 font-semibold text-right">REGULAR PRICE</th>
                    <th className="py-3 px-4 font-semibold text-right">TODAY PRICE</th>
                    <th className="py-3 px-4 font-semibold">DISCOUNT</th>
                    <th className="py-3 px-4 font-semibold">CHEF RECOMMENDATION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tabData.specials.map((sp: any) => (
                    <tr key={sp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{sp.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{sp.description}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{sp.category}</td>
                      <td className="py-3.5 px-4 text-right font-mono line-through text-slate-400">{fmtInr(sp.regularPrice)}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">{fmtInr(sp.todayPrice)}</td>
                      <td className="py-3.5 px-4 font-mono text-amber-600 font-bold text-[10px]">{sp.discount || "SPECIAL"}</td>
                      <td className="py-3.5 px-4 font-mono text-purple-600 font-semibold">{sp.chefRecommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: BILLING SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {loadingTabs.settings ? (
            <div className="flex justify-center p-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#0052ff]" />
            </div>
          ) : !tabData.settings ? (
            <div className="p-8 text-center text-slate-500">Failed to load billing settings.</div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#0052ff]" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">Configured Billing Charge Defaults</h2>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  READ ONLY VIEW
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">DEFAULT PACKAGING CHARGE</div>
                  <div className="text-3xl font-bold font-mono text-emerald-600">{fmtInr(tabData.settings.defaultPackagingCharge)}</div>
                  <p className="text-[11px] text-slate-500">Default takeaway & delivery packaging fee</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">DEFAULT SERVICE CHARGE</div>
                  <div className="text-3xl font-bold font-mono text-blue-600">{fmtInr(tabData.settings.defaultServiceCharge)}</div>
                  <p className="text-[11px] text-slate-500">Default dining service fee</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">DEFAULT SPLITTING CHARGE</div>
                  <div className="text-3xl font-bold font-mono text-purple-600">{fmtInr(tabData.settings.defaultSplittingCharge)}</div>
                  <p className="text-[11px] text-slate-500">Default bill splitting fee</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ORDER DETAILS MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setSelectedOrderDetails(null);
        }}
        title={`Order Details — #ORD-${selectedOrderDetails?.id.slice(-4).toUpperCase()}`}
        subtitle={`Order Type: ${selectedOrderDetails?.orderType || "N/A"} | Date: ${selectedOrderDetails ? new Date(selectedOrderDetails.createdAt).toLocaleString() : ""}`}
      >
        {selectedOrderDetails && (
          <div className="space-y-6 text-xs text-slate-700">
            {/* Metadata Summary */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]">
              <div>Customer: <strong className="text-slate-900">{selectedOrderDetails.customerName || "Walk-in Guest"}</strong></div>
              <div>Phone: <strong className="text-slate-800">{selectedOrderDetails.customerPhone || "N/A"}</strong></div>
              <div>Table: <strong className="text-slate-800">{selectedOrderDetails.table ? `T-${selectedOrderDetails.table.tableNumber}` : "N/A"}</strong></div>
              <div>Status: <strong className="text-[#0052ff] uppercase">{selectedOrderDetails.status}</strong></div>
              <div>Payment: <strong className="text-emerald-600 uppercase">{selectedOrderDetails.paymentStatus}</strong></div>
              <div>Payment ID: <strong className="text-slate-500">{selectedOrderDetails.razorpayPaymentId || "N/A"}</strong></div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 font-mono uppercase text-[11px]">Order Line Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">ITEM</th>
                      <th className="py-2 px-3 font-mono">QTY</th>
                      <th className="py-2 px-3 text-right">UNIT PRICE</th>
                      <th className="py-2 px-3 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedOrderDetails.items as Array<any>).map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {item.name} {item.variant && <span className="text-[10px] font-mono text-[#0052ff]">({item.variant})</span>}
                          {item.notes && <div className="text-[10px] text-slate-500 font-normal">{item.notes}</div>}
                        </td>
                        <td className="py-2 px-3 font-mono">{item.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono">{fmtInr(item.unitPrice)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">{fmtInr(item.unitPrice * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Charges Breakdown */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 font-mono text-xs text-right">
              <div className="flex justify-between"><span>Subtotal:</span><span>{fmtInr(selectedOrderDetails.subtotal)}</span></div>
              <div className="flex justify-between"><span>GST Tax:</span><span>{fmtInr(selectedOrderDetails.tax)}</span></div>
              {selectedOrderDetails.packagingCharge > 0 && <div className="flex justify-between"><span>Packaging Fee:</span><span>{fmtInr(selectedOrderDetails.packagingCharge)}</span></div>}
              {selectedOrderDetails.serviceCharge > 0 && <div className="flex justify-between"><span>Service Fee:</span><span>{fmtInr(selectedOrderDetails.serviceCharge)}</span></div>}
              {selectedOrderDetails.splittingCharge > 0 && <div className="flex justify-between"><span>Splitting Fee:</span><span>{fmtInr(selectedOrderDetails.splittingCharge)}</span></div>}
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-emerald-600">
                <span>Grand Total:</span><span>{fmtInr(selectedOrderDetails.total)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
