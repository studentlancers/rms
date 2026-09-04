"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Sparkles,
  ChevronRight,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  Receipt,
  Eye,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { listOrders } from "@/actions/orders";
import { listTables } from "@/actions/tables";

export default function StaffDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const isFetchingRef = React.useRef(false);

  // Fetch telemetry from PostgreSQL database
  const loadStaffDashboardData = async (silent = false) => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (!silent) setIsLoading(true);
      const [fetchedOrders, fetchedTables] = await Promise.all([
        listOrders(),
        listTables(),
      ]);

      setOrders(fetchedOrders || []);
      setTables(fetchedTables || []);
    } catch (err: any) {
      console.error("Error loading staff dashboard telemetry:", err);
      if (!silent) toast.error(err.message || "Failed to load staff telemetry");
    } finally {
      isFetchingRef.current = false;
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaffDashboardData();

    // 8-second polling interval with visibility guard
    const interval = setInterval(() => {
      loadStaffDashboardData(true);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Today's Sales & Orders Metrics
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!o.createdAt) return false;
      const dStr = new Date(o.createdAt).toISOString().slice(0, 10);
      return dStr === todayStr;
    });
  }, [orders, todayStr]);

  const completedToday = useMemo(() => {
    return todayOrders.filter((o) => o.status === "COMPLETED");
  }, [todayOrders]);

  const shiftSalesTotal = useMemo(() => {
    return completedToday.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [completedToday]);

  // Active Tables Metrics
  const totalTables = tables.length;
  const occupiedTables = tables.filter((t) => t.status === "OCCUPIED").length;
  const availableTables = tables.filter((t) => t.status === "FREE").length;
  const capacityPercent = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

  // Pending Bills Metrics
  const pendingBillOrders = useMemo(() => {
    return orders.filter(
      (o) => o.paymentStatus === "PENDING" && o.status !== "CANCELLED"
    );
  }, [orders]);

  const pendingBillTotal = useMemo(() => {
    return pendingBillOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [pendingBillOrders]);

  // Recent Orders (Top 5)
  const recentOrdersList = useMemo(() => {
    return orders.slice(0, 5);
  }, [orders]);

  // Derived Activity Feed from real orders & tables
  const activityFeed = useMemo(() => {
    const activities: Array<{ id: string; time: string; text: string; icon: any }> = [];

    orders.slice(0, 4).forEach((ord) => {
      const orderToken = `#ORD-${ord.id.slice(-4).toUpperCase()}`;
      const timeStr = ord.createdAt
        ? new Date(ord.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "Just now";

      if (ord.status === "PENDING") {
        activities.push({
          id: `ord-pending-${ord.id}`,
          time: timeStr,
          text: `New order ${orderToken} created for ${ord.table ? `Table ${ord.table.tableNumber}` : ord.orderType}`,
          icon: UtensilsCrossed,
        });
      } else if (ord.status === "COMPLETED") {
        activities.push({
          id: `ord-comp-${ord.id}`,
          time: timeStr,
          text: `Bill ${orderToken} settled (₹${ord.total?.toFixed(2)} - ${ord.paymentStatus})`,
          icon: Receipt,
        });
      } else {
        activities.push({
          id: `ord-status-${ord.id}`,
          time: timeStr,
          text: `Order ${orderToken} marked '${ord.status}'`,
          icon: CheckCircle2,
        });
      }
    });

    tables.filter((t) => t.status === "OCCUPIED").slice(0, 2).forEach((tbl) => {
      activities.push({
        id: `tbl-occ-${tbl.id}`,
        time: "Active shift",
        text: `Table ${tbl.tableNumber} status updated to 'Occupied'`,
        icon: Users,
      });
    });

    return activities.slice(0, 4);
  }, [orders, tables]);

  // Items formatter for JSON items blob
  const formatItemsSummary = (items: any) => {
    if (!items || !Array.isArray(items)) return "Standard Order Items";
    return items
      .map((i: any) => `${i.quantity || 1}x ${i.name || "Item"}`)
      .join(", ");
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">STAFF SERVICE OVERVIEW</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Shift Operations Console
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time telemetry for shift sales, table seating, and active customer orders.
          </p>
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="SHIFT SALES"
          value={isLoading ? "..." : `₹${shiftSalesTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          subtext="today's completed POS sales"
          trend={{ value: "Live POS", isPositive: true }}
        />
        <StatCard
          label="ACTIVE TABLES"
          value={isLoading ? "..." : `${occupiedTables} / ${totalTables}`}
          subtext={`${capacityPercent}% floor capacity occupied`}
          trend={{ value: `${availableTables} Available`, isPositive: true }}
        />
        <StatCard
          label="PENDING BILLS"
          value={isLoading ? "..." : `${pendingBillOrders.length} Orders`}
          subtext="Awaiting cashier settlement"
          trend={{ value: `₹${pendingBillTotal.toFixed(2)}`, isPositive: false }}
        />
      </div>

      {/* Middle Row: Revenue Performance Wave Chart & Staff Actions Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Revenue Performance Wave Chart (Span 2) */}
        <div className="lg:col-span-2 design-surface p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                SHIFT ORDERS FLOW
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold tracking-tight text-slate-900">
                  {isLoading ? "..." : `${todayOrders.length} Orders Served Today`}
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                  Live DB
                </span>
              </div>
            </div>
          </div>

          {/* SVG Wave Chart */}
          <div className="relative h-44 w-full pt-4">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 500 120"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="staffChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0052ff" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0052ff" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 100 Q 80 40, 160 70 T 320 30 T 500 60 L 500 120 L 0 120 Z"
                fill="url(#staffChartGradient)"
              />
              <path
                d="M 0 100 Q 80 40, 160 70 T 320 30 T 500 60"
                fill="none"
                stroke="#0052ff"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Staff Quick Actions Dark Card (1 col) */}
        <div className="bg-[#0a0e1a] text-white p-6 rounded-2xl border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-mono font-semibold tracking-wider text-blue-400 uppercase">
                SHIFT SHORTCUTS
              </span>
            </div>
            <h3 className="text-lg font-bold tracking-tight text-white mb-2">
              Staff Operational Terminal
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Quick access to POS billing terminal, table seating controls, and kitchen inventory checks.
            </p>
          </div>

          <div className="space-y-2">
            <Link href="/staff/menu" className="block">
              <Button className="w-full bg-[#0052ff] hover:bg-[#0046dc] text-white font-semibold text-xs h-9 justify-between">
                <span className="flex items-center gap-2">
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Open POS & Billing</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>

            <Link href="/staff/tables" className="block">
              <Button variant="outline" className="w-full border-slate-800 bg-slate-900/80 text-slate-200 hover:bg-slate-800 font-semibold text-xs h-9 justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Manage Tables</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </Button>
            </Link>

            <Link href="/staff/inventory" className="block">
              <Button variant="outline" className="w-full border-slate-800 bg-slate-900/80 text-slate-200 hover:bg-slate-800 font-semibold text-xs h-9 justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                  <span>View Inventory</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Shift Orders & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Card (Span 2) */}
        <div className="lg:col-span-2 design-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                RECENT ORDERS
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Active Shift Service Orders
              </h3>
            </div>

            <Link href="/staff/menu">
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 font-semibold gap-1">
                <span>View POS</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="overflow-hidden border border-slate-200/80 rounded-xl bg-white">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-slate-600">Order Token</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Table / Type</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 hidden sm:table-cell">Items Summary</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Total</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading live orders...
                    </TableCell>
                  </TableRow>
                ) : recentOrdersList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      No active shift orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrdersList.map((order) => {
                    const orderToken = `#ORD-${order.id.slice(-4).toUpperCase()}`;
                    const tableLabel = order.table ? `Table ${order.table.tableNumber}` : order.orderType;
                    const itemsSummary = formatItemsSummary(order.items);

                    return (
                      <TableRow key={order.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-slate-900">
                          {orderToken}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold text-slate-800">{tableLabel}</div>
                          <div className="text-[10px] text-slate-500">{order.customerName || "Walk-in Guest"}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell max-w-[200px] truncate text-xs text-slate-600">
                          {itemsSummary}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-900">
                          ₹{order.total?.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailOpen(true);
                            }}
                            className="h-7 px-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Activity Timeline Card (1 col) */}
        <div className="design-surface p-6 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase mb-1">
              LIVE SHIFT LOG
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Recent Activity
            </h3>

            <div className="space-y-4">
              {activityFeed.length === 0 ? (
                <p className="text-xs text-slate-400">No recent shift activity logged yet.</p>
              ) : (
                activityFeed.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div key={act.id} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 last:border-0">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 font-medium leading-snug">{act.text}</p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{act.time}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Order Details — #ORD-${selectedOrder.id.slice(-4).toUpperCase()}`}
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-slate-500 block">Table & Customer:</span>
                <span className="font-semibold text-slate-900">
                  {selectedOrder.table ? `Table ${selectedOrder.table.tableNumber}` : selectedOrder.orderType} (
                  {selectedOrder.customerName || "Walk-in Guest"})
                </span>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 uppercase block">Ordered Items</span>
              <div className="p-3 border border-slate-200 rounded-lg text-slate-700 leading-relaxed bg-white">
                {formatItemsSummary(selectedOrder.items)}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 font-bold text-slate-900 border-t border-slate-100">
              <span>Total Amount:</span>
              <span className="text-base text-blue-600">₹{selectedOrder.total?.toFixed(2)}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
              <Link href="/staff/menu">
                <Button size="sm" className="bg-[#0052ff] text-white hover:bg-blue-700 border-none cursor-pointer">
                  Open in POS
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
