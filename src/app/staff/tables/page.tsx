"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  UtensilsCrossed,
  Receipt,
  CheckCircle2,
  ArrowRightLeft,
  Eye,
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { listTables, updateTableStatus } from "@/actions/tables";

export default function StaffTablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");

  // Modals state
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [isOpenOrderModal, setIsOpenOrderModal] = useState(false);
  const [isMoveTableModal, setIsMoveTableModal] = useState(false);
  const [targetTableId, setTargetTableId] = useState("");
  const [guestCount, setGuestCount] = useState("2");

  const statusFilters = ["All", "Available", "Occupied", "Reserved"];

  // Fetch Tables from PostgreSQL
  const loadTablesData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const fetchedTables = await listTables();
      setTables(fetchedTables || []);
    } catch (err: any) {
      console.error("Error loading tables:", err);
      if (!silent) toast.error(err.message || "Failed to load tables");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTablesData();

    // 5-second polling interval for live floor plan telemetry
    const interval = setInterval(() => {
      loadTablesData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // UI Status Mapper
  const getUiStatus = (dbStatus: string) => {
    switch (dbStatus) {
      case "FREE":
        return "Available";
      case "OCCUPIED":
        return "Occupied";
      case "RESERVED":
        return "Reserved";
      default:
        return "Available";
    }
  };

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const uiStatus = getUiStatus(table.status);
      const matchesSearch =
        table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatusFilter === "All" || uiStatus === selectedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tables, searchQuery, selectedStatusFilter]);

  // Handle Mark Available Action
  const handleMarkAvailable = async (tableId: string) => {
    try {
      // Optimistic UI Update
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: "FREE" } : t))
      );

      await updateTableStatus(tableId, "FREE");
      toast.success("Table marked as Available!");
      await loadTablesData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update table status");
      await loadTablesData(true);
    }
  };

  // Handle Move / Transfer Table Action
  const handleMoveTable = async () => {
    if (!selectedTable || !targetTableId) return;

    try {
      // Free current table and occupy target table
      await updateTableStatus(selectedTable.id, "FREE");
      await updateTableStatus(targetTableId, "OCCUPIED");

      toast.success(`Transferred Table ${selectedTable.tableNumber} to target table`);
      setIsMoveTableModal(false);
      setSelectedTable(null);
      await loadTablesData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to transfer table");
      await loadTablesData(true);
    }
  };

  // Stats Calculations
  const totalTables = tables.length;
  const availableCount = tables.filter((t) => t.status === "FREE").length;
  const occupiedCount = tables.filter((t) => t.status === "OCCUPIED").length;
  const reservedCount = tables.filter((t) => t.status === "RESERVED").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">FLOOR MANAGEMENT</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
            Restaurant Tables Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time table status, seating assignments, and action menu.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="AVAILABLE TABLES"
          value={isLoading ? "..." : `${availableCount} / ${totalTables}`}
          subtext="Ready for guests"
          trend={{ value: "Live Floor", isPositive: true }}
        />
        <StatCard
          label="OCCUPIED TABLES"
          value={isLoading ? "..." : `${occupiedCount} / ${totalTables}`}
          subtext="Active dining service"
          trend={{ value: "In service", isPositive: true }}
        />
        <StatCard
          label="RESERVED TABLES"
          value={isLoading ? "..." : `${reservedCount} Tables`}
          subtext="Upcoming slots"
          trend={{ value: "Booked slots", isPositive: true }}
        />
      </div>

      {/* Status Filter Pills & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {statusFilters.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedStatusFilter === st
                  ? "bg-slate-900 text-white"
                  : "bg-[#f1f5f9] text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search table number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-full border-slate-200 bg-white shadow-2xs"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="design-surface p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Loading live table floor plan...</span>
        </div>
      )}

      {/* Restaurant Tables Data Table */}
      {!isLoading && (
        <div className="overflow-hidden border border-slate-200/80 rounded-2xl bg-white shadow-xs">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-600">Table Number</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Capacity</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Current Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Active Order Token</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Pending Bookings</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    No matching tables found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTables.map((table) => {
                  const uiStatus = getUiStatus(table.status);
                  const activeOrder = table.orders && table.orders.length > 0 ? `#ORD-${table.orders[0].id.slice(-4).toUpperCase()}` : null;
                  const activeBooking = table.reservations && table.reservations.length > 0 ? table.reservations[0].customerName : null;

                  return (
                    <TableRow key={table.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell className="font-bold text-xs text-slate-900">
                        Table {table.tableNumber}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium">
                        {table.capacity} Seats
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={uiStatus} />
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold text-slate-900">
                        {activeOrder || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium">
                        {activeBooking ? `Booked by ${activeBooking}` : "-"}
                      </TableCell>

                      {/* Dropdown Menu Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase">
                              Table Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTable(table);
                                setIsOpenOrderModal(true);
                              }}
                              className="text-xs gap-2 text-slate-700 cursor-pointer"
                            >
                              <UtensilsCrossed className="w-3.5 h-3.5 text-blue-600" />
                              <span>Open Order</span>
                            </DropdownMenuItem>

                            <Link href="/staff/orders">
                              <DropdownMenuItem className="text-xs gap-2 text-slate-700 cursor-pointer">
                                <Receipt className="w-3.5 h-3.5 text-rose-600" />
                                <span>Generate Bill</span>
                              </DropdownMenuItem>
                            </Link>

                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTable(table);
                                setIsMoveTableModal(true);
                              }}
                              className="text-xs gap-2 text-slate-700 cursor-pointer"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
                              <span>Move Table</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => handleMarkAvailable(table.id)}
                              className="text-xs gap-2 text-emerald-600 cursor-pointer font-semibold"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Available</span>
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

      {/* Open Order Modal */}
      {selectedTable && isOpenOrderModal && (
        <Modal
          isOpen={isOpenOrderModal}
          onClose={() => setIsOpenOrderModal(false)}
          title={`Open New Order — Table ${selectedTable.tableNumber}`}
        >
          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Number of Guests</label>
              <Input
                type="number"
                min="1"
                max={selectedTable.capacity}
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="h-9 text-xs border-slate-200 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsOpenOrderModal(false)}>
                Cancel
              </Button>
              <Link href="/staff/orders">
                <Button size="sm" className="bg-[#0052ff] hover:bg-[#0046dc] text-white font-semibold cursor-pointer">
                  Open POS Terminal
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}

      {/* Move Table Modal */}
      {selectedTable && isMoveTableModal && (
        <Modal
          isOpen={isMoveTableModal}
          onClose={() => setIsMoveTableModal(false)}
          title={`Transfer Table — Table ${selectedTable.tableNumber}`}
        >
          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Select Target Available Table</label>
              <select
                value={targetTableId}
                onChange={(e) => setTargetTableId(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none"
              >
                <option value="">Select destination table...</option>
                {tables
                  .filter((t) => t.status === "FREE" && t.id !== selectedTable.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      Table {t.tableNumber} ({t.capacity} Seats)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsMoveTableModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleMoveTable}
                disabled={!targetTableId}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer"
              >
                Confirm Move
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
