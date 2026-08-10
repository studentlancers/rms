"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Receipt,
  Plus,
  Search,
  Eye,
  Printer,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { listOrders, createOrder } from "@/actions/orders";
import { listMenuItems } from "@/actions/menu";
import { listTables } from "@/actions/tables";

export default function StaffBillingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Selected order for Tax Invoice Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Create Bill Modal State
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [cartItems, setCartItems] = useState<Array<{ menuItemId: string; name: string; quantity: number; unitPrice: number }>>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);

  // Fetch orders, menu items, and tables
  const loadBillingData = async () => {
    try {
      setIsLoading(true);
      const [fetchedOrders, fetchedItems, fetchedTables] = await Promise.all([
        listOrders(),
        listMenuItems(),
        listTables(),
      ]);

      setOrders(fetchedOrders || []);
      setMenuItems(fetchedItems || []);
      setTables(fetchedTables || []);

      if (fetchedTables && fetchedTables.length > 0 && !selectedTableId) {
        setSelectedTableId(fetchedTables[0].id);
      }
      if (fetchedItems && fetchedItems.length > 0 && !selectedMenuItemId) {
        setSelectedMenuItemId(fetchedItems[0].id);
      }
    } catch (err: any) {
      console.error("Error loading billing data:", err);
      toast.error(err.message || "Failed to load billing history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  // Format Invoice ID
  const formatInvoiceNumber = (id: string) => {
    return `#INV-${id.slice(-4).toUpperCase()}`;
  };

  // Format Items Summary
  const formatItemsSummary = (items: any) => {
    if (typeof items === "string") return items;
    if (Array.isArray(items)) {
      return items.map((i) => `${i.quantity}x ${i.name}`).join(", ");
    }
    return "Ordered Items";
  };

  // Filtered Bills
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const invNo = formatInvoiceNumber(o.id);
      const matchesSearch =
        invNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.table?.tableNumber && o.table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        selectedStatus === "all" || o.paymentStatus === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, selectedStatus]);

  // Billing Stat Calculations
  const stats = useMemo(() => {
    const totalCount = orders.length;
    const paidOrders = orders.filter((o) => o.paymentStatus === "PAID");
    const totalRev = paidOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const unpaidCount = orders.filter((o) => o.paymentStatus !== "PAID").length;
    const avgTicket = totalCount > 0 ? orders.reduce((acc, b) => acc + (b.total || 0), 0) / totalCount : 0;

    return {
      totalBills: totalCount,
      totalRevenue: `₹${totalRev.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      unpaidBills: unpaidCount,
      avgTicketSize: `₹${avgTicket.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    };
  }, [orders]);

  // Handle Razorpay Payment Creation (/api/payments/create-order)
  const handleInitiateRazorpay = async (orderId: string) => {
    setIsProcessingPayment(true);
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment order creation failed");

      toast.success(`Razorpay Order Created: ${data.razorpayOrderId}`);
      alert(`Razorpay Gateway Checkout Simulated!\nRazorpay Order ID: ${data.razorpayOrderId}\nAmount: ₹${(data.amount / 100).toFixed(2)}`);
      await loadBillingData();
    } catch (err: any) {
      toast.error(err.message || "Failed to process payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Add Item to Quick Bill Cart
  const handleAddToCart = () => {
    const item = menuItems.find((m) => m.id === selectedMenuItemId);
    if (!item) return;

    setCartItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) => (i.menuItemId === item.id ? { ...i, quantity: i.quantity + selectedQty } : i));
      }
      return [...prev, { menuItemId: item.id, name: item.name, quantity: selectedQty, unitPrice: item.price }];
    });

    toast.success(`Added ${selectedQty}x ${item.name}`);
  };

  // Submit Create Quick Bill
  const handleCreateBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error("Please add at least one dish to the bill");
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrder({
        orderType: selectedTableId ? "DINE_IN" : "TAKEAWAY",
        tableId: selectedTableId || undefined,
        items: cartItems,
      });

      toast.success("Bill generated successfully");
      setIsCreateBillOpen(false);
      setCartItems([]);
      await loadBillingData();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-widest mb-2">
            STAFF WORKSPACE — POS BILLING
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Billing & Invoices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate customer bills, manage POS transactions, process payments, and print tax receipts.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateBillOpen(true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md border-none cursor-pointer self-start md:self-auto"
        >
          <Receipt className="w-4 h-4" />
          <span>Quick Create Bill</span>
        </Button>
      </div>

      {/* Payment Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="SHIFT TOTAL BILLS"
          value={isLoading ? "..." : `${stats.totalBills} Invoices`}
          subtext="generated by staff"
        />
        <StatCard
          label="SHIFT REVENUE PAID"
          value={isLoading ? "..." : stats.totalRevenue}
          subtext="cleared transactions"
        />
        <StatCard
          label="UNPAID / PENDING"
          value={isLoading ? "..." : `${stats.unpaidBills} Bills`}
          subtext="open customer tabs"
        />
        <StatCard
          label="AVERAGE TICKET SIZE"
          value={isLoading ? "..." : stats.avgTicketSize}
          subtext="per dining table"
        />
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="design-surface p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Loading live billing records from database...</span>
        </div>
      )}

      {/* Main Billing History Table Surface */}
      {!isLoading && (
        <div className="design-surface p-6 space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
              <Input
                placeholder="Search by invoice # or table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 h-9 bg-slate-50 border-slate-200 rounded-xl text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-600/20"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none cursor-pointer h-9"
              >
                <option value="all">All Payment Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          {/* Current & Completed Bills Data Table */}
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">INVOICE NO.</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">TYPE & TABLE</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ITEMS SUMMARY</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">DATE & TIME</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">TOTAL (₹)</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">PAYMENT STATUS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                    No billing records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const invNo = formatInvoiceNumber(order.id);
                  const time = new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

                  return (
                    <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                      <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                        {invNo}
                      </TableCell>
                      <TableCell className="py-4 px-4 font-semibold text-slate-800">
                        <div>{order.orderType}</div>
                        <div className="text-[10px] text-blue-600 font-mono">
                          {order.table?.tableNumber ? `Table ${order.table.tableNumber}` : "Counter"}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-slate-600 max-w-[220px] truncate">
                        {formatItemsSummary(order.items)}
                      </TableCell>
                      <TableCell className="py-4 px-4 font-mono text-slate-500">
                        {time}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{order.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <StatusBadge status={order.paymentStatus} />
                      </TableCell>
                      <TableCell className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsInvoiceOpen(true);
                          }}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-100/80 rounded-lg cursor-pointer transition-colors"
                          title="View Tax Invoice"
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

      {/* Modal: View Tax Invoice & Payment Trigger */}
      {selectedOrder && isInvoiceOpen && (
        <Modal
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          title={`Tax Invoice — ${formatInvoiceNumber(selectedOrder.id)}`}
        >
          <div className="space-y-4 py-2 text-xs font-mono">
            <div className="text-center pb-3 border-b border-dashed border-slate-300 font-sans">
              <h3 className="font-bold text-base text-slate-900">GRAND BISTRO RESTAURANT</h3>
              <p className="text-xs text-slate-500 mt-0.5">GSTIN: 07AAAAA0000A1Z5 • Staff POS Station</p>
              <p className="text-[10px] text-slate-400 mt-1">
                Invoice: {formatInvoiceNumber(selectedOrder.id)} | Order Type: {selectedOrder.orderType}
              </p>
            </div>

            <div className="py-3 border-t border-b border-dashed border-slate-300 space-y-2">
              <div className="font-bold font-sans text-slate-700 uppercase text-[10px]">Ordered Items Summary</div>
              <div className="p-3 bg-slate-50 rounded-lg text-slate-900 font-sans font-medium">
                {formatItemsSummary(selectedOrder.items)}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{selectedOrder.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (5%):</span>
                <span>₹{selectedOrder.tax?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-dashed border-slate-300 font-sans">
                <span>GRAND TOTAL:</span>
                <span className="text-blue-600">₹{selectedOrder.total?.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 font-sans border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsInvoiceOpen(false)}>
                Close
              </Button>
              {selectedOrder.paymentStatus !== "PAID" && (
                <Button
                  size="sm"
                  disabled={isProcessingPayment}
                  onClick={() => handleInitiateRazorpay(selectedOrder.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {isProcessingPayment ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                    </span>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay via Razorpay
                    </>
                  )}
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  alert(`Tax receipt for ${formatInvoiceNumber(selectedOrder.id)} printed!`);
                  setIsInvoiceOpen(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Receipt
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Quick Create Bill */}
      <Modal
        isOpen={isCreateBillOpen}
        onClose={() => setIsCreateBillOpen(false)}
        title="Create New Customer Bill (POS)"
        subtitle="Select table & dishes to generate instant tax bill."
      >
        <form onSubmit={handleCreateBillSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Table Selection (Optional for Takeaway)
            </label>
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="w-full px-3 py-2 h-10 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
            >
              <option value="">Counter / Takeaway Order</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Table {t.tableNumber} ({t.capacity} seats - {t.status})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-xs font-semibold text-slate-800">Add Item to Bill</div>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-7">
                <select
                  value={selectedMenuItemId}
                  onChange={(e) => setSelectedMenuItemId(e.target.value)}
                  className="w-full px-3 py-2 h-9 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                >
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — ₹{item.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  min="1"
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full h-9 text-xs rounded-lg font-mono"
                />
              </div>
              <div className="col-span-2">
                <Button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full h-9 text-xs bg-blue-600 text-white rounded-lg p-0"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Cart Preview */}
            <div className="space-y-1.5 pt-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Selected Items ({cartItems.length})</div>
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs p-2 bg-white rounded border border-slate-200">
                  <span className="font-medium text-slate-800">{item.quantity}x {item.name}</span>
                  <span className="font-mono font-bold text-slate-900">₹{(item.quantity * item.unitPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateBillOpen(false)}
              className="px-4 py-2 h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || cartItems.length === 0}
              className="px-5 py-2 h-9 text-xs bg-[#0052ff] hover:bg-[#0046dc] text-white font-semibold rounded-xl border-none cursor-pointer"
            >
              {isSubmitting ? "Generating..." : "Generate Bill"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
