"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";

interface KitchenOrder {
  token: string;
  orderId: string;
  table: string;
  items: string;
  instructions: string;
  chef: string;
  status: "Pending" | "Preparing" | "Ready" | "Served";
  waitingMins: number;
}

const initialKitchenOrders: KitchenOrder[] = [
  {
    token: "#KT-104",
    orderId: "ORD-3001",
    table: "Table 04",
    items: "2x Butter Chicken, 4x Butter Naan, 1x Dal Makhani",
    instructions: "Medium spicy, extra butter on naan",
    chef: "Chef Vikram",
    status: "Preparing",
    waitingMins: 18, // Delayed > 15 mins
  },
  {
    token: "#KT-105",
    orderId: "ORD-3002",
    table: "Table 02",
    items: "1x Paneer Tikka, 2x Fresh Lime Soda",
    instructions: "No onions, extra green chutney",
    chef: "Chef Anish",
    status: "Pending",
    waitingMins: 6,
  },
  {
    token: "#KT-106",
    orderId: "ORD-3004",
    table: "Delivery # Swiggy",
    items: "2x Chili Chicken, 2x Schezwan Fried Rice",
    instructions: "Pack extra cutlery and chili sauce",
    chef: "Chef Vikram",
    status: "Preparing",
    waitingMins: 14,
  },
  {
    token: "#KT-107",
    orderId: "ORD-3005",
    table: "Table 08",
    items: "1x Mutton Seekh Kebab, 2x Cold Coffee",
    instructions: "Serve coffee hot if requested",
    chef: "Chef Ramesh",
    status: "Pending",
    waitingMins: 4,
  },
];

export default function KitchenDisplayPage() {
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>(initialKitchenOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Status updates
  const handleStatusUpdate = (token: string, newStatus: KitchenOrder["status"]) => {
    setKitchenOrders((prev) =>
      prev.map((o) => (o.token === token ? { ...o, status: newStatus } : o))
    );
  };

  const filteredOrders = useMemo(() => {
    return kitchenOrders.filter((order) => {
      const matchesSearch =
        order.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.table.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.chef.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "all" || order.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [kitchenOrders, searchQuery, selectedStatus]);

  const activeTokens = kitchenOrders.length;
  const preparingCount = kitchenOrders.filter((o) => o.status === "Preparing").length;
  const delayedCount = kitchenOrders.filter((o) => o.waitingMins >= 15).length;

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
          value={`${activeTokens} Tokens`}
          subtext="in live queue"
          trend={{ value: "↗ Live Queue", isPositive: true }}
        />
        <StatCard
          label="ORDERS PREPARING"
          value={`${preparingCount} Dishes`}
          subtext="on cooktop / tandoor"
          trend={{ value: "↗ Cooking active", isPositive: true }}
        />
        <StatCard
          label="LONG WAITING ORDERS"
          value={`${delayedCount} Tokens`}
          subtext="over 15 mins wait"
          trend={{ value: "Attention Required", isPositive: false }}
        />
      </div>

      {/* Main Data Table Surface */}
      <div className="design-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
            <Input
              placeholder="Search token, order ID, or chef..."
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
              <option value="Pending">Pending</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready">Ready</option>
              <option value="Served">Served</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">TOKEN #</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ORDER & TABLE</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ITEMS LIST</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden md:table-cell">SPECIAL INSTRUCTIONS</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden lg:table-cell">ASSIGNED CHEF</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">KITCHEN STATUS</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">WAITING TIME</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-xs">
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                  No active kitchen tokens found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const isDelayed = order.waitingMins >= 15;

                return (
                  <TableRow key={order.token} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                    <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                      {order.token}
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div className="font-semibold text-slate-800">{order.table}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{order.orderId}</div>
                    </TableCell>
                    <TableCell className="py-4 px-4 font-medium text-slate-900 max-w-[200px]">
                      {order.items}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-rose-600 font-medium hidden md:table-cell">
                      {order.instructions || "None"}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-slate-600 hidden lg:table-cell">
                      {order.chef}
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <StatusBadge status={order.status === "Preparing" ? "In Progress" : order.status === "Ready" ? "Healthy" : "Scheduled"} />
                    </TableCell>
                    <TableCell className="py-4 px-4 font-mono font-bold">
                      <span className={isDelayed ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200" : "text-slate-700"}>
                        {order.waitingMins} mins
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
                          {order.status === "Pending" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(order.token, "Preparing")}
                              className="text-xs gap-2 text-blue-600 cursor-pointer font-semibold"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Start Preparing</span>
                            </DropdownMenuItem>
                          )}
                          {order.status === "Preparing" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(order.token, "Ready")}
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

      {/* Kitchen Detail Modal */}
      {selectedOrder && isDetailOpen && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Kitchen Token — ${selectedOrder.token}`}
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-slate-500 block">Location & Chef:</span>
                <span className="font-semibold text-slate-900">{selectedOrder.table} ({selectedOrder.chef})</span>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 uppercase block">Dishes to Prepare</span>
              <div className="p-3 border border-slate-200 rounded-lg bg-white leading-relaxed text-slate-800 font-semibold">
                {selectedOrder.items}
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-rose-600 uppercase block">Special Instructions</span>
              <div className="p-3 border border-rose-200 rounded-lg bg-rose-50 text-rose-700">
                {selectedOrder.instructions || "No special instructions."}
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
