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
  UtensilsCrossed,
  Receipt,
  CheckCircle2,
  ArrowRightLeft,
  Eye,
} from "lucide-react";

type TableStatus = "Available" | "Occupied" | "Reserved" | "Cleaning" | "Billing";

interface RestaurantTable {
  id: string;
  number: string;
  capacity: number;
  assignedWaiter: string;
  status: TableStatus;
  statusBadge: "Healthy" | "Low" | "Warning" | "Critical" | "Completed" | "In Progress";
  activeOrder: string | null;
  guests: number;
  occupiedSince: string;
  section: string;
}

const initialTables: RestaurantTable[] = [
  {
    id: "T-01",
    number: "Table 01",
    capacity: 2,
    assignedWaiter: "Alex Rivera",
    status: "Available",
    statusBadge: "Healthy",
    activeOrder: null,
    guests: 0,
    occupiedSince: "-",
    section: "Main Hall",
  },
  {
    id: "T-02",
    number: "Table 02",
    capacity: 4,
    assignedWaiter: "Sarah Connor",
    status: "Occupied",
    statusBadge: "In Progress",
    activeOrder: "ORD-2040",
    guests: 3,
    occupiedSince: "35 mins ago",
    section: "Main Hall",
  },
  {
    id: "T-03",
    number: "Table 03",
    capacity: 2,
    assignedWaiter: "Alex Rivera",
    status: "Reserved",
    statusBadge: "Warning",
    activeOrder: null,
    guests: 0,
    occupiedSince: "For 7:30 PM",
    section: "Window Bay",
  },
  {
    id: "T-04",
    number: "Table 04",
    capacity: 4,
    assignedWaiter: "Alex Rivera",
    status: "Occupied",
    statusBadge: "In Progress",
    activeOrder: "ORD-2041",
    guests: 4,
    occupiedSince: "50 mins ago",
    section: "Main Hall",
  },
  {
    id: "T-05",
    number: "Table 05",
    capacity: 6,
    assignedWaiter: "Marco Rossi",
    status: "Billing",
    statusBadge: "Low",
    activeOrder: "ORD-2038",
    guests: 5,
    occupiedSince: "1 hr 10 mins ago",
    section: "Patio Terrace",
  },
  {
    id: "T-06",
    number: "Table 06",
    capacity: 4,
    assignedWaiter: "Sarah Connor",
    status: "Cleaning",
    statusBadge: "Critical",
    activeOrder: null,
    guests: 0,
    occupiedSince: "Just now",
    section: "Main Hall",
  },
];

export default function StaffTablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>(initialTables);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");

  // Modals state
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [isOpenOrderModal, setIsOpenOrderModal] = useState(false);
  const [isViewOrderModal, setIsViewOrderModal] = useState(false);
  const [isMoveTableModal, setIsMoveTableModal] = useState(false);
  const [targetTableId, setTargetTableId] = useState("");

  const [guestCount, setGuestCount] = useState("2");

  const statusFilters = ["All", "Available", "Occupied", "Reserved", "Cleaning", "Billing"];

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchesSearch =
        table.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.assignedWaiter.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.section.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatusFilter === "All" || table.status === selectedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tables, searchQuery, selectedStatusFilter]);

  const handleMarkAvailable = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, status: "Available", statusBadge: "Healthy", activeOrder: null, guests: 0, occupiedSince: "-" }
          : t
      )
    );
  };

  const handleMoveTable = () => {
    if (!selectedTable || !targetTableId) return;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === targetTableId) {
          return {
            ...t,
            status: "Occupied",
            statusBadge: "In Progress",
            activeOrder: selectedTable.activeOrder,
            guests: selectedTable.guests,
            occupiedSince: selectedTable.occupiedSince,
          };
        }
        if (t.id === selectedTable.id) {
          return { ...t, status: "Cleaning", statusBadge: "Critical", activeOrder: null, guests: 0, occupiedSince: "Just now" };
        }
        return t;
      })
    );
    setIsMoveTableModal(false);
    setSelectedTable(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header matching Owner Tables */}
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

      {/* Top Stat Cards matching Owner Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="AVAILABLE TABLES"
          value="6 / 18"
          subtext="Ready for guests"
          trend={{ value: "33% Available", isPositive: true }}
        />
        <StatCard
          label="OCCUPIED TABLES"
          value="10 / 18"
          subtext="Active dining service"
          trend={{ value: "55% Capacity", isPositive: true }}
        />
        <StatCard
          label="RESERVED TABLES"
          value="2 Tables"
          subtext="Upcoming evening slots"
          trend={{ value: "↗ 2 Slot Bookings", isPositive: true }}
        />
      </div>

      {/* Status Filter Pills & Search matching Owner Inventory */}
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
            placeholder="Search table or waiter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-full border-slate-200 bg-white shadow-2xs"
          />
        </div>
      </div>

      {/* Restaurant Tables Data Table matching Owner Inventory */}
      <div className="overflow-hidden border border-slate-200/80 rounded-2xl bg-white shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="text-xs font-semibold text-slate-600">Table Number</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">Capacity</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">Assigned Waiter</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">Current Status</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">Active Order</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">Guests</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 hidden md:table-cell">Occupied Since</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTables.map((table) => (
              <TableRow key={table.id} className="hover:bg-slate-50/60 transition-colors">
                <TableCell className="font-bold text-xs text-slate-900">
                  <div>{table.number}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{table.section}</div>
                </TableCell>
                <TableCell className="text-xs text-slate-700 font-medium">
                  {table.capacity} Seats
                </TableCell>
                <TableCell className="text-xs text-slate-800 font-medium">
                  {table.assignedWaiter}
                </TableCell>
                <TableCell>
                  <StatusBadge status={table.status} />
                </TableCell>
                <TableCell className="text-xs font-mono font-bold text-slate-900">
                  {table.activeOrder || "-"}
                </TableCell>
                <TableCell className="text-xs text-slate-700">
                  {table.guests > 0 ? `${table.guests} / ${table.capacity}` : "-"}
                </TableCell>
                <TableCell className="text-xs text-slate-500 hidden md:table-cell">
                  {table.occupiedSince}
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

                      {table.activeOrder && (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTable(table);
                            setIsViewOrderModal(true);
                          }}
                          className="text-xs gap-2 text-slate-700 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>View Order</span>
                        </DropdownMenuItem>
                      )}

                      <Link href="/staff/menu">
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Open Order Modal */}
      {selectedTable && isOpenOrderModal && (
        <Modal
          isOpen={isOpenOrderModal}
          onClose={() => setIsOpenOrderModal(false)}
          title={`Open New Order — ${selectedTable.number}`}
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
                className="h-9 text-xs border-slate-200"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Assigned Waiter</label>
              <Input
                value={selectedTable.assignedWaiter}
                disabled
                className="h-9 text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsOpenOrderModal(false)}>
                Cancel
              </Button>
              <Link href="/staff/menu">
                <Button size="sm" className="bg-[#0052ff] hover:bg-[#0046dc] text-white font-semibold">
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
          title={`Transfer Table — ${selectedTable.number}`}
        >
          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Select Target Available Table</label>
              <select
                value={targetTableId}
                onChange={(e) => setTargetTableId(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="">Select destination table...</option>
                {tables
                  .filter((t) => t.status === "Available")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.number} ({t.capacity} Seats — {t.section})
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
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
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
