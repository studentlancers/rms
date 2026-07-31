"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Plus,
  ChevronDown,
  Sparkles,
  ChevronRight,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  Receipt,
  Eye,
  CheckCircle2,
} from "lucide-react";

const recentOrders = [
  {
    id: "ORD-2041",
    table: "Table 04",
    type: "Dine-in",
    waiter: "Alex Rivera",
    items: "2x Ribeye Steak, 1x Truffle Fries, 2x Pinot Noir",
    total: "₹1,425.00",
    status: "In Progress",
    time: "5 mins ago",
  },
  {
    id: "ORD-2040",
    table: "Table 02",
    type: "Dine-in",
    waiter: "Sarah Connor",
    items: "1x Salmon Risotto, 1x Caesar Salad, 2x Sparkling Water",
    total: "₹680.00",
    status: "Served",
    time: "12 mins ago",
  },
  {
    id: "ORD-2039",
    table: "Takeout #12",
    type: "Takeout",
    waiter: "Counter POS",
    items: "3x Margherita Pizza, 3x Gelato, 3x Iced Teas",
    total: "₹952.00",
    status: "Warning",
    time: "18 mins ago",
  },
  {
    id: "ORD-2038",
    table: "Table 08",
    type: "Dine-in",
    waiter: "Alex Rivera",
    items: "4x Beef Burger, 4x Craft Beer",
    total: "₹1,180.00",
    status: "Completed",
    time: "32 mins ago",
  },
];

const recentActivity = [
  {
    id: 1,
    time: "12:42 PM",
    text: "Order #ORD-2041 sent to kitchen for Table 04",
    icon: UtensilsCrossed,
  },
  {
    id: 2,
    time: "12:38 PM",
    text: "Table 02 status changed to 'Occupied' (3 Guests)",
    icon: Users,
  },
  {
    id: 3,
    time: "12:25 PM",
    text: "Bill #INV-8812 printed for Table 08 (₹1,180.00 - Paid via UPI)",
    icon: Receipt,
  },
  {
    id: 4,
    time: "12:10 PM",
    text: "Table 06 marked 'Cleaning Completed' by Sarah",
    icon: CheckCircle2,
  },
];

export default function StaffDashboardPage() {
  const [selectedOrder, setSelectedOrder] = useState<typeof recentOrders[0] | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">STAFF SERVICE OVERVIEW</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Good morning, Alex.
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here&apos;s how your shift service is performing today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors">
            <span>Shift Today</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <Link href="/staff/menu">
            <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>New Order</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Top 3 Stat Cards (Matching Owner Dashboard format) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="SHIFT SALES"
          value="₹14,250.00"
          subtext="vs. yesterday shift"
          trend={{ value: "↗ +14.2%", isPositive: true }}
        />
        <StatCard
          label="ACTIVE TABLES"
          value="12 / 18"
          subtext="66% floor capacity"
          trend={{ value: "↗ 6 Available", isPositive: true }}
        />
        <StatCard
          label="PENDING BILLS"
          value="3 Orders"
          subtext="Awaiting cashier settlement"
          trend={{ value: "₹3,057.00", isPositive: false }}
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
                  48 Covers Served
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                  ↗ 12.5%
                </span>
              </div>
            </div>

            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              <span>Today</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* SVG Wave Chart matching Owner Overview */}
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
                  <TableHead className="text-xs font-semibold text-slate-600">Order ID</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Table / Type</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 hidden sm:table-cell">Items Summary</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Total</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-slate-900">
                      {order.id}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-slate-800">{order.table}</div>
                      <div className="text-[10px] text-slate-500">{order.type} • {order.waiter}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell max-w-[180px] truncate text-xs text-slate-600">
                      {order.items}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-900">
                      {order.total}
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
                        className="h-7 px-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
              {recentActivity.map((act) => {
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
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Order Details — ${selectedOrder.id}`}
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-slate-500 block">Table & Staff:</span>
                <span className="font-semibold text-slate-900">{selectedOrder.table} ({selectedOrder.waiter})</span>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 uppercase block">Ordered Items</span>
              <div className="p-3 border border-slate-200 rounded-lg text-slate-700 leading-relaxed bg-white">
                {selectedOrder.items}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 font-bold text-slate-900 border-t border-slate-100">
              <span>Total Amount:</span>
              <span className="text-base text-blue-600">{selectedOrder.total}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
              <Link href="/staff/menu">
                <Button size="sm" className="bg-[#0052ff] text-white hover:bg-blue-700">
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
