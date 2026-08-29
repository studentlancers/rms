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
  Eye,
  Receipt,
  Printer,
  Building2,
  Bike,
  Plus,
  Loader2,
  Play,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  listOrders,
  listLiveOrders,
  createOrder,
  updateOrderStatus,
} from "@/actions/orders";
import { listMenuItems } from "@/actions/menu";
import { listTables } from "@/actions/tables";

export default function StaffOrdersPage() {
  const [activeTab, setActiveTab] = useState<"hotel" | "platform">("hotel");

  // Dynamic Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Order Details & Print Modals
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Create Order Modal State (POS)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY" | "DELIVERY">("DINE_IN");
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [cartItems, setCartItems] = useState<Array<{ menuItemId: string; name: string; quantity: number; unitPrice: number }>>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>("");
  const [selectedQty, setSelectedQty] = useState<number>(1);

  // Fetch Orders, Menu Items, and Tables
  const loadOrdersData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [ordersRes, menuRes, tablesRes] = await Promise.allSettled([
        listOrders(),
        listMenuItems(),
        listTables(),
      ]);

      const fetchedOrders = ordersRes.status === "fulfilled" ? ordersRes.value : [];
      const fetchedMenuItems = menuRes.status === "fulfilled" ? menuRes.value : [];
      const fetchedTables = tablesRes.status === "fulfilled" ? tablesRes.value : [];

      setOrders(fetchedOrders || []);
      setMenuItems(fetchedMenuItems || []);
      setTables(fetchedTables || []);
    } catch (err: any) {
      console.error("Error loading orders data:", err);
      if (!silent) toast.error(err.message || "Failed to load orders");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrdersData();

    // 5-second polling interval for live synchronization
    const interval = setInterval(() => {
      loadOrdersData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Format Order ID
  const formatOrderId = (id: string) => {
    return `#ORD-${id.slice(-4).toUpperCase()}`;
  };

  // Filtered Hotel Orders (Dine-In & Takeaway)
  const hotelOrders = useMemo(() => {
    return orders.filter((o) => o.orderType === "DINE_IN" || o.orderType === "TAKEAWAY");
  }, [orders]);

  // Filtered Platform Orders (Delivery)
  const platformOrders = useMemo(() => {
    return orders.filter((o) => o.orderType === "DELIVERY");
  }, [orders]);

  // Display Filtered Hotel Orders
  const filteredHotelOrders = useMemo(() => {
    return hotelOrders.filter((order) => {
      const orderToken = formatOrderId(order.id);
      const matchesSearch =
        orderToken.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.table?.tableNumber && order.table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        selectedStatus === "all" || order.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [hotelOrders, searchQuery, selectedStatus]);

  // Display Filtered Platform Orders
  const filteredPlatformOrders = useMemo(() => {
    return platformOrders.filter((order) => {
      const orderToken = formatOrderId(order.id);
      const matchesSearch =
        orderToken.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "all" || order.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [platformOrders, searchQuery, selectedStatus]);

  // Stats Calculations
  const totalOrdersCount = orders.length;
  const preparingCount = orders.filter(
    (o) => o.status === "PREPARING" || o.status === "PENDING"
  ).length;
  const completedCount = orders.filter(
    (o) => o.status === "COMPLETED" || o.status === "SERVED"
  ).length;

  // POS Cart Add Item Helper
  const handleAddToCart = () => {
    const activeMenuItemId = selectedMenuItemId || (menuItems[0]?.id ?? "");
    const targetItem = menuItems.find((m) => m.id === activeMenuItemId);
    if (!targetItem) {
      toast.error("Please select a valid menu item");
      return;
    }

    if (targetItem.stockStatus === "Out of Stock" || targetItem.effectiveIsAvailable === false) {
      toast.error(`"${targetItem.name}" is currently Out of Stock due to ingredient availability.`);
      return;
    }

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.menuItemId === targetItem.id);
      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex].quantity += selectedQty;
        return copy;
      }
      return [
        ...prev,
        {
          menuItemId: targetItem.id,
          name: targetItem.name,
          quantity: selectedQty,
          unitPrice: targetItem.price,
        },
      ];
    });

    toast.success(`Added ${selectedQty}x ${targetItem.name}`);
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Create Order Form
  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error("Please add at least one item to the order");
      return;
    }

    const activeTableId = selectedTableId || (tables[0]?.id ?? "");

    if (orderType === "DINE_IN" && !activeTableId) {
      toast.error("Table selection is required for Dine-In orders");
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrder({
        orderType,
        tableId: orderType === "DINE_IN" ? activeTableId : undefined,
        items: cartItems,
      });

      toast.success("Order created successfully!");
      setIsCreateModalOpen(false);
      setCartItems([]);
      setSelectedTableId("");
      await loadOrdersData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Transition Handler
  const handleUpdateStatus = async (orderId: string, newStatus: any) => {
    try {
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      await loadOrdersData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update order status");
      await loadOrdersData(true);
    }
  };

  // Helper to render Order Items Summary
  const renderItemsSummary = (items: any) => {
    if (typeof items === "string") return items;
    if (Array.isArray(items)) {
      return items.map((i) => `${i.quantity}x ${i.name}`).join(", ");
    }
    return "Order items";
  };
  // Open Create Order Modal Helper
  const handleOpenCreateModal = () => {
    if (tables && tables.length > 0) {
      if (!selectedTableId || !tables.some((t: any) => t.id === selectedTableId)) {
        setSelectedTableId(tables[0].id);
      }
    }
    if (menuItems && menuItems.length > 0) {
      if (!selectedMenuItemId || !menuItems.some((m: any) => m.id === selectedMenuItemId)) {
        setSelectedMenuItemId(menuItems[0].id);
      }
    }
    setIsCreateModalOpen(true);
  };

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
            Track dine-in, takeaway, and delivery orders placed during current shift.
          </p>
          <Button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md border-none cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create POS Order</span>
          </Button>
        </div>

        {/* Right Side: The 3 Statistics Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="TOTAL SHIFT ORDERS"
            value={isLoading ? "..." : `${totalOrdersCount} Orders`}
            subtext="hotel & platform total"
            trend={{ value: "Live Stream", isPositive: true }}
          />
          <StatCard
            label="ACTIVE PREPARATION"
            value={isLoading ? "..." : `${preparingCount} Orders`}
            subtext="in kitchen queue"
            trend={{ value: "Live Queue", isPositive: true }}
          />
          <StatCard
            label="COMPLETED ORDERS"
            value={isLoading ? "..." : `${completedCount} Orders`}
            subtext="served & delivered"
            trend={{ value: "High fulfillment", isPositive: true }}
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

      {/* Loading Indicator */}
      {isLoading && (
        <div className="design-surface p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Loading shift orders from database...</span>
        </div>
      )}

      {/* TAB 1: HOTEL ORDERS */}
      {!isLoading && activeTab === "hotel" && (
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
              <option value="PENDING">Pending</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="SERVED">Served</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ORDER ID</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">TYPE & TABLE</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ITEMS SUMMARY</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">AMOUNT</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STATUS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden lg:table-cell">CREATED TIME</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {filteredHotelOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                    No hotel orders found in shift database.
                  </TableCell>
                </TableRow>
              ) : (
                filteredHotelOrders.map((order) => {
                  const token = formatOrderId(order.id);
                  const time = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                      <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">{token}</TableCell>
                      <TableCell className="py-4 px-4 font-semibold text-slate-800">
                        <div>{order.orderType}</div>
                        <div className="text-[10px] text-blue-600 font-mono">
                          {order.table?.tableNumber ? `Table ${order.table.tableNumber}` : "Counter"}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-slate-500 max-w-[220px] truncate">
                        {renderItemsSummary(order.items)}
                      </TableCell>
                      <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                        ₹{order.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="py-4 px-4 font-mono text-slate-500 hidden lg:table-cell">{time}</TableCell>
                      <TableCell className="py-4 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase">Order Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {order.status === "PENDING" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                                className="text-xs gap-2 text-blue-600 font-semibold cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5" /> Start Preparing
                              </DropdownMenuItem>
                            )}
                            {order.status === "PREPARING" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(order.id, "READY")}
                                className="text-xs gap-2 text-purple-600 font-semibold cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Ready
                              </DropdownMenuItem>
                            )}
                            {order.status === "READY" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(order.id, "SERVED")}
                                className="text-xs gap-2 text-emerald-600 font-semibold cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Served
                              </DropdownMenuItem>
                            )}
                            {order.status === "SERVED" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                                className="text-xs gap-2 text-emerald-700 font-semibold cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Complete Order
                              </DropdownMenuItem>
                            )}
                            {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                                className="text-xs gap-2 text-rose-600 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Cancel Order
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsDetailOpen(true);
                              }}
                              className="text-xs gap-2 text-slate-700 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" /> View Order
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsPrintOpen(true);
                              }}
                              className="text-xs gap-2 text-slate-700 cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5 text-purple-600" /> View Tax Bill
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

      {/* TAB 2: PLATFORM ORDERS */}
      {!isLoading && activeTab === "platform" && (
        <div className="design-surface p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
              <Input
                placeholder="Search platform order ID..."
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
              <option value="PENDING">Pending</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ORDER ID</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">DELIVERY STATUS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ITEMS SUMMARY</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">AMOUNT</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ORDER STATUS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden lg:table-cell">CREATED TIME</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {filteredPlatformOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                    No delivery orders found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlatformOrders.map((order) => {
                  const token = formatOrderId(order.id);
                  const time = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                      <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">{token}</TableCell>
                      <TableCell className="py-4 px-4 font-semibold text-blue-600">
                        {order.delivery?.status || "Express Delivery"}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-slate-500 max-w-[200px] truncate">
                        {renderItemsSummary(order.items)}
                      </TableCell>
                      <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                        ₹{order.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="py-4 px-4 font-mono text-slate-500 hidden lg:table-cell">{time}</TableCell>
                      <TableCell className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailOpen(true);
                          }}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-100/80 rounded-lg cursor-pointer transition-colors"
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

      {/* Modal: View Order Details */}
      {selectedOrder && isDetailOpen && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Order Details — ${formatOrderId(selectedOrder.id)}`}
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-slate-500 block">Order Type & Location:</span>
                <span className="font-semibold text-slate-900">
                  {selectedOrder.orderType} {selectedOrder.table?.tableNumber ? `(Table ${selectedOrder.table.tableNumber})` : ""}
                </span>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 uppercase block">Items List</span>
              <div className="p-3 border border-slate-200 rounded-lg bg-white leading-relaxed text-slate-800 font-mono">
                {renderItemsSummary(selectedOrder.items)}
              </div>
            </div>

            <div className="space-y-1 bg-slate-50 p-3 rounded-lg font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{selectedOrder.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (5%):</span>
                <span>₹{selectedOrder.tax?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-blue-600">₹{selectedOrder.total?.toFixed(2)}</span>
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

      {/* Modal: Print / View Tax Bill */}
      {selectedOrder && isPrintOpen && (
        <Modal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          title={`Tax Invoice — ${formatOrderId(selectedOrder.id)}`}
        >
          <div className="space-y-4 py-2 font-mono text-xs">
            <div className="text-center pb-2 border-b border-dashed border-slate-300 font-sans">
              <h3 className="font-bold text-sm text-slate-900">GRAND BISTRO RESTAURANT</h3>
              <p className="text-[10px] text-slate-500">Order Token: {formatOrderId(selectedOrder.id)}</p>
            </div>

            <div className="py-2 space-y-1 text-slate-800">
              <div className="flex justify-between">
                <span>{renderItemsSummary(selectedOrder.items)}</span>
                <span>₹{selectedOrder.subtotal?.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-dashed border-slate-300">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{selectedOrder.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (5%):</span>
                <span>₹{selectedOrder.tax?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 font-sans pt-1 border-t border-slate-300">
                <span>TOTAL PAID:</span>
                <span className="text-blue-600">₹{selectedOrder.total?.toFixed(2)}</span>
              </div>
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
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Receipt
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Create POS Order */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New POS Order"
        subtitle="Select dining table, add dishes from menu, and submit to kitchen."
      >
        <form onSubmit={handleCreateOrderSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order Type *
              </label>
              <select
                value={orderType}
                onChange={(e: any) => setOrderType(e.target.value)}
                className="w-full px-3 py-2 h-10 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                <option value="DINE_IN">Dine-In</option>
                <option value="TAKEAWAY">Takeaway</option>
                <option value="DELIVERY">Delivery</option>
              </select>
            </div>

            {orderType === "DINE_IN" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Table Selection *
                </label>
                <select
                  value={selectedTableId || (tables[0]?.id ?? "")}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full px-3 py-2 h-10 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none cursor-pointer"
                >
                  {tables.length === 0 ? (
                    <option value="">No tables configured (Takeaway mode)</option>
                  ) : (
                    tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        Table {t.tableNumber} ({t.capacity} seats - {t.status})
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-xs font-semibold text-slate-800">Add Dish to Order</div>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-7">
                <select
                  value={selectedMenuItemId || (menuItems[0]?.id ?? "")}
                  onChange={(e) => setSelectedMenuItemId(e.target.value)}
                  className="w-full px-3 py-2 h-9 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none cursor-pointer"
                >
                  {menuItems.map((item) => {
                    const statusBadge =
                      item.stockStatus === "Out of Stock" || item.effectiveIsAvailable === false
                        ? "🔴 Out of Stock"
                        : item.stockStatus === "Low Stock"
                        ? "🟡 Low Stock"
                        : "🟢 Available";

                    const isOut =
                      item.stockStatus === "Out of Stock" || item.effectiveIsAvailable === false;

                    return (
                      <option key={item.id} value={item.id} disabled={isOut}>
                        {item.name} — ₹{item.price.toFixed(2)} ({statusBadge})
                      </option>
                    );
                  })}
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
              {cartItems.length === 0 ? (
                <div className="text-xs text-slate-400 italic">No items added yet.</div>
              ) : (
                cartItems.map((cartItem, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="font-medium text-slate-800">{cartItem.quantity}x {cartItem.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900">₹{(cartItem.quantity * cartItem.unitPrice).toFixed(2)}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFromCart(idx)}
                        className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || cartItems.length === 0}
              className="px-5 py-2 h-9 text-xs bg-[#0052ff] hover:bg-[#0046dc] text-white font-semibold rounded-xl border-none cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                </span>
              ) : (
                "Submit Order"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
