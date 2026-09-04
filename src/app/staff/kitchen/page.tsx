"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreVertical,
  CheckCircle2,
  Play,
  Eye,
  Loader2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { listLiveOrders, updateOrderStatus } from "@/actions/orders";

export default function KitchenDisplayPage() {
  const [kitchenOrders, setKitchenOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const isFetchingRef = React.useRef(false);

  // Load live cooking orders from database
  const loadKitchenQueue = async (silent = false) => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (!silent) setIsLoading(true);
      const activeOrders = await listLiveOrders();
      setKitchenOrders(activeOrders || []);
    } catch (err: any) {
      console.error("Error loading kitchen orders:", err);
      if (!silent) toast.error(err.message || "Failed to load kitchen queue");
    } finally {
      isFetchingRef.current = false;
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKitchenQueue();

    // 5-second polling interval for real-time kitchen updates with visibility guard
    const interval = setInterval(() => {
      loadKitchenQueue(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Format Order ID
  const formatOrderId = (id: string) => {
    return `#KT-${id.slice(-4).toUpperCase()}`;
  };

  // Helper to format Items list
  const formatItemsList = (items: any) => {
    if (typeof items === "string") return items;
    if (Array.isArray(items)) {
      return items.map((i) => `${i.quantity}x ${i.name}`).join(", ");
    }
    return "Items";
  };

  // Calculate Waiting Minutes
  const getWaitingMins = (createdAt: string) => {
    const start = new Date(createdAt).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / 60000) || 1;
  };

  // Status update handler
  const handleStatusUpdate = async (orderId: string, newStatus: any) => {
    try {
      // Optimistic update
      setKitchenOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      await updateOrderStatus(orderId, newStatus);
      toast.success(`Kitchen status updated to ${newStatus}`);
      await loadKitchenQueue(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update kitchen status");
      await loadKitchenQueue(true);
    }
  };

  // Filtered Kitchen Orders
  const filteredOrders = useMemo(() => {
    return kitchenOrders.filter((order) => {
      const token = formatOrderId(order.id);
      const matchesSearch =
        token.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.table?.tableNumber && order.table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        selectedStatus === "all" || order.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [kitchenOrders, searchQuery, selectedStatus]);

  const activeTokens = kitchenOrders.length;
  const preparingCount = kitchenOrders.filter((o) => o.status === "PREPARING").length;
  const delayedCount = kitchenOrders.filter((o) => getWaitingMins(o.createdAt) >= 15).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">KITCHEN DISPLAY SYSTEM (KDS)</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
            Kitchen Preparation Queue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time kitchen tokens, chef assignments, special notes, and waiting timers.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="ACTIVE KITCHEN TOKENS"
          value={isLoading ? "..." : `${activeTokens} Tokens`}
          subtext="in live queue"
          trend={{ value: "Live Queue", isPositive: true }}
        />
        <StatCard
          label="ORDERS PREPARING"
          value={isLoading ? "..." : `${preparingCount} Orders`}
          subtext="on cooktop / tandoor"
          trend={{ value: "Cooking active", isPositive: true }}
        />
        <StatCard
          label="LONG WAITING ORDERS"
          value={isLoading ? "..." : `${delayedCount} Tokens`}
          subtext="over 15 mins wait"
          trend={{ value: "Attention Required", isPositive: false }}
        />
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="design-surface p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Loading live kitchen queue from database...</span>
        </div>
      )}

      {/* Main Data Table Surface */}
      {!isLoading && (
        <div className="design-surface p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
              <Input
                placeholder="Search token, order ID, or table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 h-9 bg-slate-50 border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer h-9"
              >
                <option value="all">All Kitchen Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PREPARING">Preparing</option>
                <option value="READY">Ready</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">TOKEN #</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">LOCATION / TYPE</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ITEMS LIST</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">KITCHEN STATUS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">WAITING TIME</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    No active kitchen tokens in queue.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const token = formatOrderId(order.id);
                  const waitingMins = getWaitingMins(order.createdAt);
                  const isDelayed = waitingMins >= 15;

                  return (
                    <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                      <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                        {token}
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="font-semibold text-slate-800">
                          {order.table?.tableNumber ? `Table ${order.table.tableNumber}` : order.orderType}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 font-medium text-slate-900 max-w-[220px] truncate">
                        {formatItemsList(order.items)}
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="py-4 px-4 font-mono font-bold">
                        <span className={isDelayed ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200" : "text-slate-700"}>
                          {waitingMins} mins
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase">
                              Kitchen Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {order.status === "PENDING" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(order.id, "PREPARING")}
                                className="text-xs gap-2 text-blue-600 cursor-pointer font-semibold"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Start Preparing</span>
                              </DropdownMenuItem>
                            )}
                            {order.status === "PREPARING" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(order.id, "READY")}
                                className="text-xs gap-2 text-emerald-600 cursor-pointer font-semibold"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Ready</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsDetailOpen(true);
                              }}
                              className="text-xs gap-2 text-slate-700 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>View Order</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Kitchen Detail Modal */}
      {selectedOrder && isDetailOpen && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Kitchen Token — ${formatOrderId(selectedOrder.id)}`}
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-slate-500 block">Location & Type:</span>
                <span className="font-semibold text-slate-900">
                  {selectedOrder.table?.tableNumber ? `Table ${selectedOrder.table.tableNumber}` : selectedOrder.orderType}
                </span>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 uppercase block">Dishes to Prepare</span>
              <div className="p-3 border border-slate-200 rounded-lg bg-white leading-relaxed text-slate-800 font-mono">
                {formatItemsList(selectedOrder.items)}
              </div>
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
