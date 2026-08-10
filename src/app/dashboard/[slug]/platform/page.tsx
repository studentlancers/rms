"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
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
  Eye,
  Store,
  Bike,
  Globe,
  PhoneCall,
  Layers,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { listOrders } from "@/actions/orders";

const platformTabs = [
  { id: "all", label: "All Platforms", icon: Layers },
  { id: "DINE_IN", label: "Walk-in / Dine-in", icon: Store },
  { id: "TAKEAWAY", label: "Takeaway", icon: Store },
  { id: "DELIVERY", label: "Delivery / Platform", icon: Bike },
];

export default function AdminPlatformPage() {
  const router = useRouter();
  const params = useParams();
  const slug = (params?.slug as string) || "restaurant";

  const [activeTab, setActiveTab] = useState<string>("all");
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Load live orders from backend
  const loadPlatformData = async () => {
    try {
      setIsLoading(true);
      const fetchedOrders = await listOrders();
      setOrders(fetchedOrders || []);
    } catch (err: any) {
      console.error("Error loading platform orders:", err);
      toast.error(err.message || "Failed to load platform data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  // Format Order Token
  const formatOrderToken = (id: string) => {
    return `#ORD-${id.slice(-4).toUpperCase()}`;
  };

  // Format Items
  const formatItemsList = (items: any) => {
    if (typeof items === "string") return items;
    if (Array.isArray(items)) {
      return items.map((i) => `${i.quantity}x ${i.name}`).join(", ");
    }
    return "Items";
  };

  // Filtered Orders for active tab
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesTab =
        activeTab === "all" || order.orderType === activeTab;
      const token = formatOrderToken(order.id);
      const matchesSearch =
        token.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.table?.tableNumber && order.table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        selectedStatus === "all" || order.status === selectedStatus;

      return matchesTab && matchesSearch && matchesStatus;
    });
  }, [orders, activeTab, searchQuery, selectedStatus]);

  // Calculate 3 summary card values dynamically based on active selected tab
  const summaryStats = useMemo(() => {
    const targetOrders =
      activeTab === "all"
        ? orders
        : orders.filter((o) => o.orderType === activeTab);

    const totalCount = targetOrders.length;
    const totalRev = targetOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const avgOrderVal = totalCount > 0 ? totalRev / totalCount : 0;

    return {
      todaysOrders: totalCount,
      todaysRevenue: `₹${totalRev.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      avgOrderValue: `₹${avgOrderVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    };
  }, [orders, activeTab]);

  // Platform Performance breakdown from real database
  const platformPerformance = useMemo(() => {
    const channels = ["DINE_IN", "TAKEAWAY", "DELIVERY"];
    return channels.map((ch) => {
      const channelOrders = orders.filter((o) => o.orderType === ch);
      const completed = channelOrders.filter((o) => o.status === "COMPLETED" || o.status === "SERVED").length;
      const cancelled = channelOrders.filter((o) => o.status === "CANCELLED").length;
      const pending = channelOrders.filter((o) => o.status === "PENDING" || o.status === "PREPARING").length;
      const rev = channelOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);

      return {
        platform: ch === "DINE_IN" ? "Dine-in / Walk-in" : ch === "TAKEAWAY" ? "Takeaway" : "Delivery",
        completedOrders: completed,
        cancelledOrders: cancelled,
        pendingOrders: pending,
        totalRevenue: `₹${rev.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      };
    });
  }, [orders]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">MULTI-CHANNEL MANAGEMENT</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
            Platform
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor and track orders received from different ordering channels.
          </p>
        </div>
      </div>

      {/* Platform Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200/80 pb-px scrollbar-none">
        {platformTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer",
                isActive
                  ? "border-[#0052ff] text-[#0052ff]"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3 Summary Cards for Selected Platform */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="TODAY'S ORDERS"
          value={isLoading ? "..." : `${summaryStats.todaysOrders} Orders`}
          subtext={activeTab === "all" ? "across all channels" : `for ${activeTab}`}
          trend={{ value: "Live Stream", isPositive: true }}
        />
        <StatCard
          label="TODAY'S REVENUE"
          value={isLoading ? "..." : summaryStats.todaysRevenue}
          subtext={activeTab === "all" ? "total shift earnings" : `for ${activeTab}`}
          trend={{ value: "Live Earnings", isPositive: true }}
        />
        <StatCard
          label="AVERAGE ORDER VALUE"
          value={isLoading ? "..." : summaryStats.avgOrderValue}
          subtext="per completed ticket"
          trend={{ value: "Optimal AOV", isPositive: true }}
        />
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="design-surface p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Loading platform telemetry from database...</span>
        </div>
      )}

      {/* Orders Table Surface */}
      {!isLoading && (
        <div className="design-surface p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 h-9 bg-slate-50 border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600/20"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer h-9"
            >
              <option value="all">All Order Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="SERVED">Served</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Orders Table */}
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ORDER ID</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">CHANNEL & LOCATION</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ITEMS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">AMOUNT</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STATUS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">TIME</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                    No orders found for selected platform.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const token = formatOrderToken(order.id);
                  const time = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                      <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">{token}</TableCell>
                      <TableCell className="py-4 px-4 font-semibold text-slate-800">
                        <div>{order.orderType}</div>
                        <div className="text-[10px] text-blue-600 font-mono">
                          {order.table?.tableNumber ? `Table ${order.table.tableNumber}` : "Express"}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-slate-600 max-w-[200px] truncate">
                        {formatItemsList(order.items)}
                      </TableCell>
                      <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                        ₹{order.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="py-4 px-4 font-mono text-slate-500">{time}</TableCell>
                      <TableCell className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailOpen(true);
                          }}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-100/80 rounded-lg cursor-pointer transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Platform Performance Analytics Table at Bottom */}
      {!isLoading && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0052ff]" />
              <h2 className="text-base font-semibold text-slate-900">Platform Performance Summary</h2>
            </div>
            <span className="text-xs font-mono font-medium text-slate-400">Shift Performance Metrics</span>
          </div>

          <div className="design-surface p-6">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">CHANNEL</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">COMPLETED ORDERS</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">CANCELLED ORDERS</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">PENDING / ACTIVE</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">TOTAL REVENUE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 text-xs">
                {platformPerformance.map((item) => (
                  <TableRow key={item.platform} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                    <TableCell className="py-4 px-4 font-semibold text-slate-900">{item.platform}</TableCell>
                    <TableCell className="py-4 px-4 font-mono font-bold text-emerald-600">{item.completedOrders} Completed</TableCell>
                    <TableCell className="py-4 px-4 font-mono font-semibold text-rose-500">{item.cancelledOrders} Cancelled</TableCell>
                    <TableCell className="py-4 px-4 font-mono font-semibold text-amber-600">{item.pendingOrders} Active</TableCell>
                    <TableCell className="py-4 px-4 font-mono font-bold text-slate-900 text-right">{item.totalRevenue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {selectedOrder && isDetailOpen && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Order Details — ${formatOrderToken(selectedOrder.id)}`}
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-slate-500 block">Channel / Type:</span>
                <span className="font-semibold text-slate-900">{selectedOrder.orderType}</span>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 uppercase block">Items Ordered</span>
              <div className="p-3 border border-slate-200 rounded-lg bg-white leading-relaxed text-slate-800 font-mono">
                {formatItemsList(selectedOrder.items)}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 font-bold text-slate-900 border-t border-slate-100">
              <span>Total Amount:</span>
              <span className="text-base text-blue-600">₹{selectedOrder.total.toFixed(2)}</span>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
