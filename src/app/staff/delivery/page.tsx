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
  Bike,
  Phone,
  Eye,
} from "lucide-react";

type BusinessStatus = "Pending" | "Done" | "Incomplete";

interface DeliveryOrder {
  id: string;
  customer: string;
  phone: string;
  platform: "Swiggy" | "Zomato" | "Direct" | "Pickup";
  partner: string;
  amount: string;
  payment: BusinessStatus;
  status: BusinessStatus;
  estTime: string;
}

const initialDeliveryOrders: DeliveryOrder[] = [
  {
    id: "DEL-901",
    customer: "Ananya Roy",
    phone: "+91 98765 43210",
    platform: "Swiggy",
    partner: "Swiggy Rider #41",
    amount: "₹890.00",
    payment: "Done",
    status: "Done",
    estTime: "Completed",
  },
  {
    id: "DEL-902",
    customer: "Rohan Kapoor",
    phone: "+91 98123 67890",
    platform: "Zomato",
    partner: "Zomato Valet #88",
    amount: "₹1,240.00",
    payment: "Done",
    status: "Pending",
    estTime: "25 mins",
  },
  {
    id: "DEL-903",
    customer: "Meera Nair",
    phone: "+91 97654 32109",
    platform: "Direct",
    partner: "House Rider (Suresh)",
    amount: "₹650.00",
    payment: "Incomplete",
    status: "Pending",
    estTime: "20 mins",
  },
  {
    id: "DEL-904",
    customer: "Siddharth Gupta",
    phone: "+91 99887 76655",
    platform: "Pickup",
    partner: "Self Pickup",
    amount: "₹420.00",
    payment: "Done",
    status: "Done",
    estTime: "Completed",
  },
];

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>(initialDeliveryOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleStatusUpdate = (id: string, newStatus: BusinessStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phone.includes(searchQuery);

      const matchesPlatform =
        selectedPlatform === "all" || order.platform === selectedPlatform;
      const matchesStatus =
        selectedStatus === "all" || order.status === selectedStatus;

      return matchesSearch && matchesPlatform && matchesStatus;
    });
  }, [orders, searchQuery, selectedPlatform, selectedStatus]);

  const totalDelivery = orders.length;
  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const doneCount = orders.filter((o) => o.status === "Done").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">DISPATCH & DELIVERY</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
            Delivery Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage Swiggy, Zomato, Direct, and Pickup order dispatches.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="DELIVERY ORDERS TODAY"
          value={`${totalDelivery} Orders`}
          subtext="across all platforms"
          trend={{ value: "↗ High volume", isPositive: true }}
        />
        <StatCard
          label="PENDING DISPATCHES"
          value={`${pendingCount} Orders`}
          subtext="awaiting delivery"
          trend={{ value: "In Progress", isPositive: true }}
        />
        <StatCard
          label="COMPLETED DELIVERIES"
          value={`${doneCount} Orders`}
          subtext="successfully delivered"
          trend={{ value: "↗ 100% Fulfilled", isPositive: true }}
        />
      </div>

      {/* Data Table Surface */}
      <div className="design-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
            <Input
              placeholder="Search delivery ID, customer, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 h-9 bg-slate-50 border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer h-9"
            >
              <option value="all">All Platforms</option>
              <option value="Swiggy">Swiggy</option>
              <option value="Zomato">Zomato</option>
              <option value="Direct">Direct</option>
              <option value="Pickup">Pickup</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer h-9"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Done">Done</option>
              <option value="Incomplete">Incomplete</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">DELIVERY ID</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">CUSTOMER</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">PLATFORM</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden md:table-cell">DELIVERY PARTNER</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">AMOUNT</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">PAYMENT</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">DELIVERY STATUS</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden lg:table-cell">EST TIME</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-xs">
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-slate-400 text-xs">
                  No matching delivery orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                  <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                    {order.id}
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <div className="font-semibold text-slate-800">{order.customer}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{order.phone}</div>
                  </TableCell>
                  <TableCell className="py-4 px-4 font-semibold text-blue-600">
                    {order.platform}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-slate-600 hidden md:table-cell">
                    {order.partner}
                  </TableCell>
                  <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                    {order.amount}
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <StatusBadge status={order.payment === "Done" ? "Healthy" : order.payment === "Pending" ? "Low" : "Critical"} />
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <StatusBadge status={order.status === "Done" ? "Healthy" : order.status === "Pending" ? "Low" : "Critical"} />
                  </TableCell>
                  <TableCell className="py-4 px-4 font-mono text-slate-500 hidden lg:table-cell">
                    {order.estTime}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase">
                          Delivery Actions
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
                          onClick={() => alert(`Calling customer: ${order.phone}`)}
                          className="text-xs gap-2 text-emerald-600 cursor-pointer font-semibold"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Customer</span>
                        </DropdownMenuItem>
                        {order.status !== "Done" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(order.id, "Done")}
                            className="text-xs gap-2 text-purple-600 cursor-pointer"
                          >
                            <Bike className="w-3.5 h-3.5" />
                            <span>Mark Done</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      {selectedOrder && isDetailOpen && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Delivery Details — ${selectedOrder.id}`}
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-slate-500 block">Customer Info:</span>
                <span className="font-semibold text-slate-900">{selectedOrder.customer} ({selectedOrder.phone})</span>
              </div>
              <StatusBadge status={selectedOrder.status === "Done" ? "Healthy" : "Low"} />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 border border-slate-200 rounded-lg">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Platform</span>
                <span className="text-sm font-bold text-blue-600">{selectedOrder.platform}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Rider</span>
                <span className="text-sm font-bold text-slate-800">{selectedOrder.partner}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 font-bold text-slate-900 border-t border-slate-100">
              <span>Order Amount:</span>
              <span className="text-base text-blue-600">{selectedOrder.amount} ({selectedOrder.payment})</span>
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
