"use client";

import React, { useState, useMemo } from "react";
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
  Building2,
  Bike,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HotelOrder {
  id: string;
  table: string;
  customer: string;
  waiter: string;
  items: string;
  amount: string;
  status: "Pending" | "Preparing" | "Ready" | "Served" | "Completed" | "Cancelled";
  createdTime: string;
}

interface PlatformOrder {
  id: string;
  platform: "Swiggy" | "Zomato" | "Direct Website" | "Phone Order";
  customer: string;
  partner: string;
  items: string;
  amount: string;
  status: "Preparing" | "In Progress" | "Delivered" | "Cancelled";
  createdTime: string;
}

const initialHotelOrders: HotelOrder[] = [
  {
    id: "ORD-3001",
    table: "Table 04",
    customer: "Rahul Sharma",
    waiter: "Alex Rivera",
    items: "2x Butter Chicken, 4x Butter Naan, 1x Dal Makhani",
    amount: "₹1,240.00",
    status: "Preparing",
    createdTime: "12:45 PM",
  },
  {
    id: "ORD-3002",
    table: "Table 02",
    customer: "Priya Patel",
    waiter: "Sarah Connor",
    items: "1x Paneer Tikka, 2x Fresh Lime Soda",
    amount: "₹540.00",
    status: "Ready",
    createdTime: "12:50 PM",
  },
  {
    id: "ORD-3003",
    table: "Table 08",
    customer: "Karan Johar",
    waiter: "Alex Rivera",
    items: "1x Mutton Seekh Kebab, 2x Cold Coffee",
    amount: "₹630.00",
    status: "Pending",
    createdTime: "01:22 PM",
  },
  {
    id: "ORD-3006",
    table: "Table 06",
    customer: "Siddharth Malhotra",
    waiter: "Avery Lin",
    items: "2x Chicken Dum Biryani, 2x Raita",
    amount: "₹780.00",
    status: "Served",
    createdTime: "01:30 PM",
  },
];

const initialPlatformOrders: PlatformOrder[] = [
  {
    id: "ORD-4001",
    platform: "Swiggy",
    customer: "Ananya Roy",
    partner: "Swiggy Rider #41",
    items: "2x Chili Chicken, 2x Schezwan Fried Rice",
    amount: "₹890.00",
    status: "In Progress",
    createdTime: "01:15 PM",
  },
  {
    id: "ORD-4002",
    platform: "Zomato",
    customer: "Rohan Kapoor",
    partner: "Zomato Valet #88",
    items: "1x Tandoori Chicken, 3x Butter Naan",
    amount: "₹1,120.00",
    status: "Preparing",
    createdTime: "01:20 PM",
  },
  {
    id: "ORD-4003",
    platform: "Direct Website",
    customer: "Meera Nair",
    partner: "House Delivery (Suresh)",
    items: "2x Veg Hakka Noodles, 1x Veg Spring Rolls",
    amount: "₹610.00",
    status: "Delivered",
    createdTime: "12:30 PM",
  },
  {
    id: "ORD-4004",
    platform: "Phone Order",
    customer: "Vikram Malhotra",
    partner: "Self Takeout / Express",
    items: "3x Veg Biryani, 3x Gulab Jamun",
    amount: "₹1,050.00",
    status: "Preparing",
    createdTime: "01:25 PM",
  },
];

export default function StaffOrdersPage() {
  const [activeTab, setActiveTab] = useState<"hotel" | "platform">("hotel");

  const [hotelOrders] = useState<HotelOrder[]>(initialHotelOrders);
  const [platformOrders] = useState<PlatformOrder[]>(initialPlatformOrders);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState<HotelOrder | PlatformOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Filtered Hotel Orders
  const filteredHotelOrders = useMemo(() => {
    return hotelOrders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.table.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "all" || order.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [hotelOrders, searchQuery, selectedStatus]);

  // Filtered Platform Orders
  const filteredPlatformOrders = useMemo(() => {
    return platformOrders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.platform.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "all" || order.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [platformOrders, searchQuery, selectedStatus]);

  const totalOrders = hotelOrders.length + platformOrders.length;
  const preparingCount = hotelOrders.filter((o) => o.status === "Preparing" || o.status === "Pending").length + platformOrders.filter((d) => d.status === "Preparing").length;
  const completedCount = hotelOrders.filter((o) => o.status === "Completed" || o.status === "Served").length + platformOrders.filter((d) => d.status === "Delivered").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header & Stat Cards Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Side: Header & Subtext */}
        <div className="lg:col-span-4 space-y-3">
          <div className="design-section-label">ORDER MANAGEMENT</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Shift Orders
          </h1>
          <p className="text-sm text-slate-500">
            Track dine-in, takeout, and delivery orders placed during current shift.
          </p>
        </div>

        {/* Right Side: The 3 Statistics Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="TOTAL SHIFT ORDERS"
            value={`${totalOrders} Orders`}
            subtext="hotel & platform total"
            trend={{ value: "↗ +15.4%", isPositive: true }}
          />
          <StatCard
            label="ACTIVE PREPARATION"
            value={`${preparingCount} Orders`}
            subtext="in kitchen queue"
            trend={{ value: "Live Queue", isPositive: true }}
          />
          <StatCard
            label="COMPLETED ORDERS"
            value={`${completedCount} Orders`}
            subtext="served & delivered"
            trend={{ value: "↗ High fulfillment", isPositive: true }}
          />
        </div>
      </div>

      {/* Tabs Row matching Menu & Billing */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-px">
        <button
          onClick={() => {
            setActiveTab("hotel");
            setSelectedStatus("all");
          }}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 cursor-pointer",
            activeTab === "hotel"
              ? "border-[#0052ff] text-[#0052ff]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          )}
        >
          <Building2 className="w-4 h-4" />
          <span>Hotel Orders ({hotelOrders.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("platform");
            setSelectedStatus("all");
          }}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 cursor-pointer",
            activeTab === "platform"
              ? "border-[#0052ff] text-[#0052ff]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          )}
        >
          <Bike className="w-4 h-4" />
          <span>Platform Orders ({platformOrders.length})</span>
        </button>
      </div>

      {/* TAB 1: HOTEL ORDERS */}
      {activeTab === "hotel" && (
        <div className="design-surface p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
              <Input
                placeholder="Search hotel order ID, table, or customer..."
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
              <option value="all">All Hotel Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready">Ready</option>
              <option value="Served">Served</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ORDER ID</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">TABLE</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">CUSTOMER</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden md:table-cell">WAITER</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden lg:table-cell">ITEMS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">AMOUNT</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STATUS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden lg:table-cell">CREATED TIME</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {filteredHotelOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-400 text-xs">
                    No matching hotel orders found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredHotelOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                    <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">{order.id}</TableCell>
                    <TableCell className="py-4 px-4 font-semibold text-slate-800">{order.table}</TableCell>
                    <TableCell className="py-4 px-4 text-slate-800 font-medium">{order.customer}</TableCell>
                    <TableCell className="py-4 px-4 text-slate-600 hidden md:table-cell">{order.waiter}</TableCell>
                    <TableCell className="py-4 px-4 text-slate-500 hidden lg:table-cell max-w-[200px] truncate">{order.items}</TableCell>
                    <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">{order.amount}</TableCell>
                    <TableCell className="py-4 px-4">
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="py-4 px-4 font-mono text-slate-500 hidden lg:table-cell">{order.createdTime}</TableCell>
                    <TableCell className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase">Order Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailOpen(true);
                            }}
                            className="text-xs gap-2 text-slate-700 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Order</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsPrintOpen(true);
                            }}
                            className="text-xs gap-2 text-slate-700 cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5 text-purple-600" />
                            <span>View Bill</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsPrintOpen(true);
                            }}
                            className="text-xs gap-2 text-slate-700 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Print Receipt</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 2: PLATFORM ORDERS */}
      {activeTab === "platform" && (
        <div className="design-surface p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
              <Input
                placeholder="Search platform, order ID, or customer..."
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
              <option value="all">All Platform Statuses</option>
              <option value="Preparing">Preparing</option>
              <option value="In Progress">In Progress</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ORDER ID</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">PLATFORM</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">CUSTOMER</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden md:table-cell">DELIVERY PARTNER</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden lg:table-cell">ITEMS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">AMOUNT</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STATUS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden lg:table-cell">CREATED TIME</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {filteredPlatformOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-400 text-xs">
                    No matching platform orders found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlatformOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                    <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">{order.id}</TableCell>
                    <TableCell className="py-4 px-4 font-semibold text-blue-600">{order.platform}</TableCell>
                    <TableCell className="py-4 px-4 text-slate-800 font-medium">{order.customer}</TableCell>
                    <TableCell className="py-4 px-4 text-slate-600 hidden md:table-cell">{order.partner}</TableCell>
                    <TableCell className="py-4 px-4 text-slate-500 hidden lg:table-cell max-w-[200px] truncate">{order.items}</TableCell>
                    <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">{order.amount}</TableCell>
                    <TableCell className="py-4 px-4">
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="py-4 px-4 font-mono text-slate-500 hidden lg:table-cell">{order.createdTime}</TableCell>
                    <TableCell className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase">Platform Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailOpen(true);
                            }}
                            className="text-xs gap-2 text-slate-700 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Order</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsPrintOpen(true);
                            }}
                            className="text-xs gap-2 text-slate-700 cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5 text-purple-600" />
                            <span>View Bill</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsPrintOpen(true);
                            }}
                            className="text-xs gap-2 text-slate-700 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Print Receipt</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

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
                <span className="text-slate-500 block">Customer:</span>
                <span className="font-semibold text-slate-900">{selectedOrder.customer}</span>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 uppercase block">Items List</span>
              <div className="p-3 border border-slate-200 rounded-lg bg-white leading-relaxed text-slate-800">
                {selectedOrder.items}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 font-bold text-slate-900 border-t border-slate-100">
              <span>Total Amount:</span>
              <span className="text-base text-blue-600">{selectedOrder.amount}</span>
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
              <p className="text-[10px] text-slate-500">Customer: {selectedOrder.customer}</p>
            </div>

            <div className="py-2 space-y-1 text-slate-800">
              <div className="flex justify-between">
                <span>{selectedOrder.items}</span>
                <span>{selectedOrder.amount}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between font-bold text-sm text-slate-900 font-sans">
              <span>TOTAL PAID:</span>
              <span>{selectedOrder.amount}</span>
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
