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
  Bike,
  Phone,
  Eye,
  Loader2,
  CheckCircle2,
  UserPlus,
  Play,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import {
  listActiveDeliveries,
  assignDelivery,
  updateDeliveryStatus,
} from "@/actions/delivery";
import { listOrders } from "@/actions/orders";
import { listStaff } from "@/actions/staff";

export default function AdminDeliveryOrdersPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Selected Item for Details & Assign Rider Modals
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAssignRiderOpen, setIsAssignRiderOpen] = useState(false);
  const [selectedRiderUserId, setSelectedRiderUserId] = useState("");

  // Load deliveries, orders, and staff list
  const loadDeliveryData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [activeDelivsRes, allOrdersRes, staffRes] = await Promise.allSettled([
        listActiveDeliveries(),
        listOrders(),
        listStaff(),
      ]);

      const fetchedDeliveries = activeDelivsRes.status === "fulfilled" ? activeDelivsRes.value : [];
      const fetchedOrders = allOrdersRes.status === "fulfilled" ? allOrdersRes.value : [];
      const rawStaff: any = staffRes.status === "fulfilled" ? staffRes.value : null;
      const fetchedStaff = Array.isArray(rawStaff) ? rawStaff : (rawStaff?.members || []);

      setDeliveries(fetchedDeliveries || []);
      // Filter orders to only DELIVERY type
      const delivOrders = (fetchedOrders || []).filter((o: any) => o.orderType === "DELIVERY");
      setDeliveryOrders(delivOrders);
      setStaffMembers(fetchedStaff);

      if (fetchedStaff.length > 0 && !selectedRiderUserId) {
        setSelectedRiderUserId(fetchedStaff[0].userId || fetchedStaff[0].id);
      }
    } catch (err: any) {
      console.error("Error loading admin delivery data:", err);
      if (!silent) toast.error(err.message || "Failed to load delivery telemetry");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryData();

    // 5-second polling interval for dispatch telemetry
    const interval = setInterval(() => {
      loadDeliveryData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Format Items Summary
  const formatItemsList = (items: any) => {
    if (typeof items === "string") return items;
    if (Array.isArray(items)) {
      return items.map((i) => `${i.quantity}x ${i.name}`).join(", ");
    }
    return "Delivery Items";
  };

  // Unified list of active dispatches & delivery orders
  const combinedDeliveries = useMemo(() => {
    return deliveryOrders.map((order) => {
      const activeDeliv = deliveries.find((d) => d.orderId === order.id);
      return {
        id: activeDeliv ? activeDeliv.id : order.id,
        orderId: order.id,
        orderToken: `#DEL-${order.id.slice(-4).toUpperCase()}`,
        items: order.items,
        total: order.total,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        deliveryStatus: activeDeliv ? activeDeliv.status : "UNASSIGNED",
        etaMinutes: activeDeliv?.etaMinutes || 20,
        riderUserId: activeDeliv?.riderUserId || null,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        createdAt: activeDeliv?.createdAt || order.createdAt,
        rawDelivery: activeDeliv,
        rawOrder: order,
      };
    });
  }, [deliveryOrders, deliveries]);

  // Filtered Delivery List
  const filteredOrders = useMemo(() => {
    return combinedDeliveries.filter((item) => {
      const matchesSearch =
        item.orderToken.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.customerName && item.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.customerPhone && item.customerPhone.includes(searchQuery));

      const matchesStatus =
        selectedStatus === "all" || item.deliveryStatus === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [combinedDeliveries, searchQuery, selectedStatus]);

  // Handle Rider Assignment
  const handleAssignRiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !selectedRiderUserId) {
      toast.error("Please select a valid staff member acting as rider");
      return;
    }

    setIsSubmitting(true);
    try {
      await assignDelivery(selectedItem.orderId, selectedRiderUserId);
      toast.success("Rider assigned and order dispatched out for delivery!");
      setIsAssignRiderOpen(false);
      setSelectedItem(null);
      await loadDeliveryData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to assign rider");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delivery Status Workflow Transition
  const handleStatusTransition = async (deliveryId: string, newStatus: any) => {
    try {
      setDeliveries((prev) =>
        prev.map((d) => (d.id === deliveryId ? { ...d, status: newStatus } : d))
      );

      await updateDeliveryStatus(deliveryId, newStatus);
      toast.success(`Delivery status updated to ${newStatus}`);
      await loadDeliveryData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update delivery status");
      await loadDeliveryData(true);
    }
  };

  // Stat Calculations
  const totalCount = combinedDeliveries.length;
  const activeDispatchCount = combinedDeliveries.filter(
    (d) => d.deliveryStatus !== "DELIVERED"
  ).length;
  const deliveredCount = combinedDeliveries.filter(
    (d) => d.deliveryStatus === "DELIVERED" || d.orderStatus === "COMPLETED"
  ).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">ADMIN DISPATCH & DELIVERY</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Delivery Operations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor active delivery dispatches, assign riders, track live status, and manage fulfillment.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="DELIVERY ORDERS TODAY"
          value={isLoading ? "..." : `${totalCount} Orders`}
          subtext="across active restaurant"
          trend={{ value: "Live Telemetry", isPositive: true }}
        />
        <StatCard
          label="ACTIVE DISPATCHES"
          value={isLoading ? "..." : `${activeDispatchCount} Dispatches`}
          subtext="riders in transit / assigned"
          trend={{ value: "In Transit", isPositive: true }}
        />
        <StatCard
          label="COMPLETED DELIVERIES"
          value={isLoading ? "..." : `${deliveredCount} Delivered`}
          subtext="successfully delivered"
          trend={{ value: "Fulfilled", isPositive: true }}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="design-surface p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Loading live delivery dispatches from database...</span>
        </div>
      )}

      {/* Data Table Surface */}
      {!isLoading && (
        <div className="design-surface p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
              <Input
                placeholder="Search delivery ID, customer..."
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
                <option value="all">All Delivery Statuses</option>
                <option value="UNASSIGNED">Unassigned</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="NEARBY">Nearby</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">DELIVERY ID</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">CUSTOMER</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ITEMS SUMMARY</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">AMOUNT</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">PAYMENT STATUS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">DISPATCH STATUS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                    No matching delivery dispatches found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                    <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                      {item.orderToken}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-slate-700">
                      {item.customerName || item.customerPhone ? (
                        <div>
                          <div className="font-semibold text-slate-900">{item.customerName || "—"}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.customerPhone || ""}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-slate-700 max-w-[200px] truncate">
                      {formatItemsList(item.items)}
                    </TableCell>
                    <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                      ₹{item.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <StatusBadge status={item.paymentStatus} />
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <StatusBadge status={item.deliveryStatus} />
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase">
                            Dispatch Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {item.deliveryStatus === "UNASSIGNED" && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItem(item);
                                setIsAssignRiderOpen(true);
                              }}
                              className="text-xs gap-2 text-blue-600 font-semibold cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Assign Rider
                            </DropdownMenuItem>
                          )}

                          {item.deliveryStatus === "ASSIGNED" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusTransition(item.id, "IN_TRANSIT")}
                              className="text-xs gap-2 text-purple-600 font-semibold cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" /> Start Transit
                            </DropdownMenuItem>
                          )}

                          {item.deliveryStatus === "IN_TRANSIT" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusTransition(item.id, "NEARBY")}
                              className="text-xs gap-2 text-amber-600 font-semibold cursor-pointer"
                            >
                              <Navigation className="w-3.5 h-3.5" /> Mark Nearby
                            </DropdownMenuItem>
                          )}

                          {(item.deliveryStatus === "IN_TRANSIT" || item.deliveryStatus === "NEARBY") && (
                            <DropdownMenuItem
                              onClick={() => handleStatusTransition(item.id, "DELIVERED")}
                              className="text-xs gap-2 text-emerald-600 font-semibold cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedItem(item);
                              setIsDetailOpen(true);
                            }}
                            className="text-xs gap-2 text-slate-700 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" /> View Dispatch Info
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

      {/* Modal: Assign Rider */}
      {selectedItem && isAssignRiderOpen && (
        <Modal
          isOpen={isAssignRiderOpen}
          onClose={() => setIsAssignRiderOpen(false)}
          title={`Assign Rider — ${selectedItem.orderToken}`}
          subtitle="Select staff member acting as rider to start dispatch."
        >
          <form onSubmit={handleAssignRiderSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Rider / Staff Member *
              </label>
              <select
                value={selectedRiderUserId}
                onChange={(e) => setSelectedRiderUserId(e.target.value)}
                className="w-full px-3 py-2 h-10 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                {staffMembers.length === 0 ? (
                  <option value="">No staff members available</option>
                ) : (
                  staffMembers.map((member) => (
                    <option key={member.id} value={member.userId || member.id}>
                      {member.user?.name || member.name || "Staff Member"} ({member.role})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAssignRiderOpen(false)}
                className="px-4 py-2 h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedRiderUserId}
                className="px-5 py-2 h-9 text-xs bg-[#0052ff] hover:bg-[#0046dc] text-white font-semibold rounded-xl border-none cursor-pointer"
              >
                {isSubmitting ? "Assigning..." : "Confirm Rider Assignment"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: View Dispatch Details */}
      {selectedItem && isDetailOpen && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Delivery Telemetry — ${selectedItem.orderToken}`}
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-slate-500 block">Dispatch Status:</span>
                <span className="font-semibold text-slate-900">{selectedItem.deliveryStatus}</span>
              </div>
              <StatusBadge status={selectedItem.deliveryStatus} />
            </div>

            {(selectedItem.customerName || selectedItem.customerPhone) && (
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer Details</span>
                {selectedItem.customerName && (
                  <div className="font-semibold text-slate-900">{selectedItem.customerName}</div>
                )}
                {selectedItem.customerPhone && (
                  <div className="text-slate-600 font-mono">{selectedItem.customerPhone}</div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 p-3 border border-slate-200 rounded-lg">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Order Type</span>
                <span className="text-sm font-bold text-blue-600">{selectedItem.rawOrder.orderType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Estimated ETA</span>
                <span className="text-sm font-bold text-slate-800">{selectedItem.etaMinutes} mins</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 uppercase block">Items List</span>
              <div className="p-3 border border-slate-200 rounded-lg bg-white leading-relaxed text-slate-800 font-mono">
                {formatItemsList(selectedItem.items)}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 font-bold text-slate-900 border-t border-slate-100">
              <span>Order Amount & Payment:</span>
              <span className="text-base text-blue-600">₹{selectedItem.total.toFixed(2)} ({selectedItem.paymentStatus})</span>
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
