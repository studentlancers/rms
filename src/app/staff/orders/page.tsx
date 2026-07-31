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
} from "lucide-react";

interface RestaurantOrder {
  id: string;
  table: string;
  customer: string;
  orderType: "Dine-in" | "Takeout" | "Delivery";
  waiter: string;
  items: string;
  amount: string;
  status: "Pending" | "Preparing" | "Ready" | "Served" | "Completed" | "Cancelled";
  createdTime: string;
}

const initialOrders: RestaurantOrder[] = [
  {
    id: "ORD-3001",
    table: "Table 04",
    customer: "Rahul Sharma",
    orderType: "Dine-in",
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
    orderType: "Dine-in",
    waiter: "Sarah Connor",
    items: "1x Paneer Tikka, 2x Fresh Lime Soda",
    amount: "₹540.00",
    status: "Ready",
    createdTime: "12:50 PM",
  },
  {
    id: "ORD-3003",
    table: "Takeout Counter",
    customer: "Vikram Malhotra",
    orderType: "Takeout",
    waiter: "Counter POS",
    items: "3x Veg Biryani, 3x Gulab Jamun",
    amount: "₹1,050.00",
    status: "Completed",
    createdTime: "01:05 PM",
  },
  {
    id: "ORD-3004",
    table: "Delivery # Swiggy",
    customer: "Ananya Roy",
    orderType: "Delivery",
    waiter: "Online API",
    items: "2x Chili Chicken, 2x Schezwan Fried Rice",
    amount: "₹890.00",
    status: "Served",
    createdTime: "01:15 PM",
  },
  {
    id: "ORD-3005",
    table: "Table 08",
    customer: "Karan Johar",
    orderType: "Dine-in",
    waiter: "Alex Rivera",
    items: "1x Mutton Seekh Kebab, 2x Cold Coffee",
    amount: "₹630.00",
    status: "Pending",
    createdTime: "01:22 PM",
  },
];

export default function StaffOrdersPage() {
  const [orders] = useState<RestaurantOrder[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Filter logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.table.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "all" || order.status === selectedStatus;
      const matchesType =
        selectedType === "all" || order.orderType === selectedType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [orders, searchQuery, selectedStatus, selectedType]);

  const totalOrders = orders.length;
  const preparingCount = orders.filter((o) => o.status === "Preparing" || o.status === "Pending").length;
  const completedOrders = orders.filter((o) => o.status === "Completed" || o.status === "Served").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">ORDER MANAGEMENT</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
            Shift Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track dine-in, takeout, and delivery orders placed during current shift.
          </p>
        </div>

        <Link href="/staff/menu">
          <Button className="bg-[#0052ff] hover:bg-[#0046dc] text-white font-semibold text-xs h-9 rounded-full px-5 shadow-md shadow-blue-500/20">
            <span>+ Create Order</span>
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="TOTAL ORDERS TODAY"
          value={`${totalOrders} Orders`}
          subtext="across all channels"
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
          value={`${completedOrders} Orders`}
          subtext="served & fulfilled"
          trend={{ value: "↗ High fulfillment", isPositive: true }}
        />
      </div>

      {/* Data Table Surface */}
      <div className="design-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
            <Input
              placeholder="Search order ID, customer, or table..."
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
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready">Ready</option>
              <option value="Served">Served</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer h-9"
            >
              <option value="all">All Order Types</option>
              <option value="Dine-in">Dine-in</option>
              <option value="Takeout">Takeout</option>
              <option value="Delivery">Delivery</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ORDER ID</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">TABLE</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">CUSTOMER</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ORDER TYPE</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden md:table-cell">WAITER</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden lg:table-cell">ITEMS</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">AMOUNT</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STATUS</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden lg:table-cell">CREATED TIME</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-xs">
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-slate-400 text-xs">
                  No matching orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                  <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                    {order.id}
                  </TableCell>
                  <TableCell className="py-4 px-4 font-semibold text-slate-800">
                    {order.table}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-slate-800 font-medium">
                    {order.customer}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-slate-600 font-medium">
                    {order.orderType}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-slate-600 hidden md:table-cell">
                    {order.waiter}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-slate-500 hidden lg:table-cell max-w-[180px] truncate">
                    {order.items}
                  </TableCell>
                  <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                    {order.amount}
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="py-4 px-4 font-mono text-slate-500 hidden lg:table-cell">
                    {order.createdTime}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase">
                          Order Actions
                        </DropdownMenuLabel>
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
                          <Printer className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Print Bill</span>
                        </DropdownMenuItem>
                        <Link href="/staff/menu">
                          <DropdownMenuItem className="text-xs gap-2 text-slate-700 cursor-pointer">
                            <Receipt className="w-3.5 h-3.5 text-purple-600" />
                            <span>Open POS</span>
                          </DropdownMenuItem>
                        </Link>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
                <span className="text-slate-500 block">Customer & Table:</span>
                <span className="font-semibold text-slate-900">{selectedOrder.customer} ({selectedOrder.table})</span>
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

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
              <Link href="/staff/menu">
                <Button size="sm" className="bg-[#0052ff] text-white hover:bg-blue-700">
                  Open POS
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}

      {/* Print Bill Modal */}
      {selectedOrder && isPrintOpen && (
        <Modal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          title={`Print Thermal Receipt — ${selectedOrder.id}`}
        >
          <div className="space-y-4 py-2 font-mono text-xs">
            <div className="text-center pb-2 border-b border-dashed border-slate-300 font-sans">
              <h3 className="font-bold text-sm text-slate-900">GRAND BISTRO RESTAURANT</h3>
              <p className="text-[10px] text-slate-500">{selectedOrder.table} • Staff: {selectedOrder.waiter}</p>
            </div>

            <div className="py-2 space-y-1 text-slate-800">
              <div className="flex justify-between">
                <span>{selectedOrder.items}</span>
                <span>{selectedOrder.amount}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between font-bold text-sm text-slate-900 font-sans">
              <span>TOTAL:</span>
              <span>{selectedOrder.amount}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 font-sans">
              <Button variant="outline" size="sm" onClick={() => setIsPrintOpen(false)}>
                Cancel
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
