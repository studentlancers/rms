"use client";

import React, { useState, useMemo } from "react";
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
  Eye,
  Receipt,
  Printer,
  ShoppingBag,
  Store,
  Bike,
  Globe,
  PhoneCall,
  Layers,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformOrder {
  id: string;
  platform: string;
  customerName: string;
  orderType: string;
  amount: number;
  orderStatus: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";
  createdTime: string;
  items: string;
}

interface PlatformPerformance {
  platform: string;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  totalRevenue: string;
  avgProcessingTime: string;
}

const initialPlatformOrders: PlatformOrder[] = [
  {
    id: "ORD-9001",
    platform: "Swiggy",
    customerName: "Ananya Roy",
    orderType: "Delivery",
    amount: 890.0,
    orderStatus: "Preparing",
    createdTime: "01:15 PM",
    items: "2x Chili Chicken, 2x Schezwan Fried Rice",
  },
  {
    id: "ORD-9002",
    platform: "Zomato",
    customerName: "Rohan Kapoor",
    orderType: "Delivery",
    amount: 1120.0,
    orderStatus: "Ready",
    createdTime: "01:20 PM",
    items: "1x Tandoori Chicken, 3x Butter Naan",
  },
  {
    id: "ORD-9003",
    platform: "Walk-in",
    customerName: "Rahul Sharma",
    orderType: "Dine-in",
    amount: 1240.0,
    orderStatus: "Completed",
    createdTime: "12:45 PM",
    items: "2x Butter Chicken, 4x Butter Naan, 1x Dal Makhani",
  },
  {
    id: "ORD-9004",
    platform: "Direct Website",
    customerName: "Meera Nair",
    orderType: "Delivery",
    amount: 610.0,
    orderStatus: "Completed",
    createdTime: "12:30 PM",
    items: "2x Veg Hakka Noodles, 1x Veg Spring Rolls",
  },
  {
    id: "ORD-9005",
    platform: "Takeaway",
    customerName: "Priya Patel",
    orderType: "Takeaway",
    amount: 540.0,
    orderStatus: "Ready",
    createdTime: "12:50 PM",
    items: "1x Paneer Tikka, 2x Fresh Lime Soda",
  },
  {
    id: "ORD-9006",
    platform: "Phone Orders",
    customerName: "Vikram Malhotra",
    orderType: "Takeaway",
    amount: 1050.0,
    orderStatus: "Pending",
    createdTime: "01:25 PM",
    items: "3x Veg Biryani, 3x Gulab Jamun",
  },
  {
    id: "ORD-9007",
    platform: "Swiggy",
    customerName: "Deepak Verma",
    orderType: "Delivery",
    amount: 750.0,
    orderStatus: "Completed",
    createdTime: "01:05 PM",
    items: "1x Paneer Butter Masala, 2x Garlic Naan",
  },
  {
    id: "ORD-9008",
    platform: "Zomato",
    customerName: "Sneha Reddy",
    orderType: "Delivery",
    amount: 980.0,
    orderStatus: "Completed",
    createdTime: "12:55 PM",
    items: "2x Chicken Dum Biryani, 2x Thums Up",
  },
  {
    id: "ORD-9009",
    platform: "Walk-in",
    customerName: "Aman Chopra",
    orderType: "Dine-in",
    amount: 1560.0,
    orderStatus: "Completed",
    createdTime: "01:10 PM",
    items: "2x Mutton Rogan Josh, 4x Tandoori Roti",
  },
];

const initialPlatformPerformance: PlatformPerformance[] = [
  {
    platform: "Walk-in",
    completedOrders: 38,
    cancelledOrders: 1,
    pendingOrders: 3,
    totalRevenue: "₹18,650.00",
    avgProcessingTime: "14 mins",
  },
  {
    platform: "Takeaway",
    completedOrders: 16,
    cancelledOrders: 0,
    pendingOrders: 2,
    totalRevenue: "₹7,200.00",
    avgProcessingTime: "11 mins",
  },
  {
    platform: "Swiggy",
    completedOrders: 24,
    cancelledOrders: 2,
    pendingOrders: 2,
    totalRevenue: "₹12,450.00",
    avgProcessingTime: "18 mins",
  },
  {
    platform: "Zomato",
    completedOrders: 28,
    cancelledOrders: 1,
    pendingOrders: 2,
    totalRevenue: "₹14,100.00",
    avgProcessingTime: "19 mins",
  },
  {
    platform: "Direct Website",
    completedOrders: 13,
    cancelledOrders: 0,
    pendingOrders: 1,
    totalRevenue: "₹8,900.00",
    avgProcessingTime: "16 mins",
  },
  {
    platform: "Phone Orders",
    completedOrders: 7,
    cancelledOrders: 1,
    pendingOrders: 1,
    totalRevenue: "₹4,350.00",
    avgProcessingTime: "13 mins",
  },
];

const platformTabs = [
  { id: "all", label: "All Platforms", icon: Layers },
  { id: "Walk-in", label: "Walk-in", icon: Store },
  { id: "Takeaway", label: "Takeaway", icon: ShoppingBag },
  { id: "Swiggy", label: "Swiggy", icon: Bike },
  { id: "Zomato", label: "Zomato", icon: Bike },
  { id: "Direct Website", label: "Direct Website", icon: Globe },
  { id: "Phone Orders", label: "Phone Orders", icon: PhoneCall },
];

export default function AdminPlatformPage() {
  const router = useRouter();
  const params = useParams();
  const slug = (params?.slug as string) || "restaurant";

  const [activeTab, setActiveTab] = useState<string>("all");
  const [orders] = useState<PlatformOrder[]>(initialPlatformOrders);
  const [performance] = useState<PlatformPerformance[]>(initialPlatformPerformance);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState<PlatformOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Filtered Orders for active tab
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesTab =
        activeTab === "all" || order.platform.toLowerCase() === activeTab.toLowerCase();
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "all" || order.orderStatus === selectedStatus;

      return matchesTab && matchesSearch && matchesStatus;
    });
  }, [orders, activeTab, searchQuery, selectedStatus]);

  // Calculate 3 summary card values dynamically based on active selected tab
  const summaryStats = useMemo(() => {
    const targetOrders =
      activeTab === "all"
        ? orders
        : orders.filter((o) => o.platform.toLowerCase() === activeTab.toLowerCase());

    const totalCount = targetOrders.length;
    const totalRev = targetOrders.reduce((acc, curr) => acc + curr.amount, 0);
    const avgOrderVal = totalCount > 0 ? totalRev / totalCount : 0;

    return {
      todaysOrders: totalCount,
      todaysRevenue: `₹${totalRev.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      avgOrderValue: `₹${avgOrderVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    };
  }, [orders, activeTab]);

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
            Monitor and track orders received from different ordering platforms.
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
          value={`${summaryStats.todaysOrders} Orders`}
          subtext={activeTab === "all" ? "across all platforms" : `for ${activeTab}`}
          trend={{ value: "Live Stream", isPositive: true }}
        />
        <StatCard
          label="TODAY'S REVENUE"
          value={summaryStats.todaysRevenue}
          subtext={activeTab === "all" ? "total shift earnings" : `for ${activeTab}`}
          trend={{ value: "↗ +16.2%", isPositive: true }}
        />
        <StatCard
          label="AVERAGE ORDER VALUE"
          value={summaryStats.avgOrderValue}
          subtext="per completed ticket"
          trend={{ value: "Optimal AOV", isPositive: true }}
        />
      </div>

      {/* Orders Table Surface */}
      <div className="design-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
            <Input
              placeholder={`Search ${activeTab === "all" ? "all platform" : activeTab} orders...`}
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
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Orders Table */}
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ORDER ID</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">CUSTOMER</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">AMOUNT</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STATUS</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">TIME</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-xs">
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                  No orders found for selected platform.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                  <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">{order.id}</TableCell>
                  <TableCell className="py-4 px-4 font-semibold text-slate-800">
                    <div>{order.customerName}</div>
                    <div className="text-[10px] text-blue-600 font-normal">{order.platform}</div>
                  </TableCell>
                  <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                    ₹{order.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <StatusBadge status={order.orderStatus} />
                  </TableCell>
                  <TableCell className="py-4 px-4 font-mono text-slate-500">{order.createdTime}</TableCell>
                  <TableCell className="py-4 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        router.push(`/dashboard/${slug}/platform/orders/${order.id}`)
                      }
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-100/80 rounded-lg cursor-pointer transition-colors"
                      title="View Order Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Platform Performance Analytics Table at Bottom */}
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
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">PLATFORM</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">COMPLETED ORDERS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">CANCELLED ORDERS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">PENDING ORDERS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">TOTAL REVENUE</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">AVG PROCESSING TIME</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {performance.map((item) => (
                <TableRow key={item.platform} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                  <TableCell className="py-4 px-4 font-semibold text-slate-900">{item.platform}</TableCell>
                  <TableCell className="py-4 px-4 font-mono font-bold text-emerald-600">{item.completedOrders} Completed</TableCell>
                  <TableCell className="py-4 px-4 font-mono font-semibold text-rose-500">{item.cancelledOrders} Cancelled</TableCell>
                  <TableCell className="py-4 px-4 font-mono font-semibold text-amber-600">{item.pendingOrders} Pending</TableCell>
                  <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">{item.totalRevenue}</TableCell>
                  <TableCell className="py-4 px-4 font-mono text-slate-600 text-right">{item.avgProcessingTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View Order Modal */}
      {selectedOrder && isDetailOpen && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Order Details — ${selectedOrder.id}`}
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-slate-500 block">Customer Name:</span>
                <span className="font-semibold text-slate-900">{selectedOrder.customerName} ({selectedOrder.platform})</span>
              </div>
              <StatusBadge status={selectedOrder.orderStatus} />
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 uppercase block">Items Ordered</span>
              <div className="p-3 border border-slate-200 rounded-lg bg-white leading-relaxed text-slate-800">
                {selectedOrder.items}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 font-bold text-slate-900 border-t border-slate-100">
              <span>Total Amount:</span>
              <span className="text-base text-blue-600">₹{selectedOrder.amount.toFixed(2)}</span>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Print / View Bill Modal */}
      {selectedOrder && isPrintOpen && (
        <Modal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          title={`Tax Invoice — ${selectedOrder.id}`}
        >
          <div className="space-y-4 py-2 font-mono text-xs">
            <div className="text-center pb-2 border-b border-dashed border-slate-300 font-sans">
              <h3 className="font-bold text-sm text-slate-900">GRAND BISTRO RESTAURANT</h3>
              <p className="text-[10px] text-slate-500">Platform: {selectedOrder.platform} | Customer: {selectedOrder.customerName}</p>
            </div>

            <div className="py-2 space-y-1 text-slate-800">
              <div className="flex justify-between">
                <span>{selectedOrder.items}</span>
                <span>₹{selectedOrder.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between font-bold text-sm text-slate-900 font-sans">
              <span>TOTAL PAID:</span>
              <span>₹{selectedOrder.amount.toFixed(2)}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 font-sans">
              <Button variant="outline" size="sm" onClick={() => setIsPrintOpen(false)}>
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  alert("Receipt printed successfully!");
                  setIsPrintOpen(false);
                }}
                className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
              >
                Print Receipt
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
