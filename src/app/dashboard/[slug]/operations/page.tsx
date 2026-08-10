"use client";

import React, { useState, useEffect, useMemo } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Loader2,
  XCircle,
  UserCheck,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  listReservations,
  createReservation,
  confirmReservation,
  updateReservationStatus,
} from "@/actions/reservations";
import { listTables } from "@/actions/tables";

export default function OperationsPage() {
  // Data States
  const [reservations, setReservations] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Modal States
  const [filterStatus, setFilterStatus] = useState("All");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false);

  // New Reservation Form State
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [resTime, setResTime] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [notes, setNotes] = useState("");

  // Load reservations and tables from database
  const loadOperationsData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [fetchedReservations, fetchedTables] = await Promise.all([
        listReservations(),
        listTables(),
      ]);

      setReservations(fetchedReservations || []);
      setTables(fetchedTables || []);
    } catch (err: any) {
      console.error("Error loading operations data:", err);
      if (!silent) toast.error(err.message || "Failed to load operations data");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOperationsData();

    // 5-second live telemetry synchronization
    const interval = setInterval(() => {
      loadOperationsData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    if (filterStatus === "All") return reservations;
    return reservations.filter((r) => r.status === filterStatus);
  }, [reservations, filterStatus]);

  // Handle New Booking Submission
  const handleCreateBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPhone || !resTime) {
      toast.error("Please fill in all required booking fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("customerName", custName);
      formData.append("customerPhone", custPhone);
      formData.append("partySize", partySize);
      formData.append("reservationTime", new Date(resTime).toISOString());
      if (selectedTableId) formData.append("tableId", selectedTableId);
      if (notes) formData.append("notes", notes);

      await createReservation(formData);
      toast.success("New table booking logged successfully!");

      setIsBookingModalOpen(false);
      setCustName("");
      setCustPhone("");
      setPartySize("2");
      setResTime("");
      setSelectedTableId("");
      setNotes("");

      await loadOperationsData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to create reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Confirm Reservation
  const handleConfirmReservation = async (reservationId: string, tableId: string) => {
    try {
      await confirmReservation(reservationId, tableId);
      toast.success("Reservation confirmed and table reserved!");
      await loadOperationsData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm reservation");
    }
  };

  // Handle Reservation Status Update
  const handleStatusUpdate = async (reservationId: string, newStatus: any) => {
    try {
      await updateReservationStatus(reservationId, newStatus);
      toast.success(`Reservation status updated to ${newStatus}`);
      await loadOperationsData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update reservation status");
    }
  };

  // Stats Calculations
  const totalCovers = reservations.reduce((acc, curr) => acc + (curr.partySize || 0), 0);
  const activeTablesCount = tables.filter((t) => t.status === "OCCUPIED" || t.status === "RESERVED").length;
  const totalTablesCount = tables.length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">SERVICE CONTROL</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Operations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Keep today&apos;s floor moving from one calm command centre.
          </p>
        </div>

        <Button
          onClick={() => setIsBookingModalOpen(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start md:self-auto h-auto border-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New booking</span>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="TOTAL COVERS BOOKED"
          value={isLoading ? "..." : `${totalCovers} Guests`}
          subtext="today's reservations"
        />
        <StatCard
          label="TABLES ACTIVE"
          value={isLoading ? "..." : `${activeTablesCount} / ${totalTablesCount}`}
          subtext="seated & reserved"
        />
        <StatCard
          label="PENDING BOOKINGS"
          value={isLoading ? "..." : `${reservations.filter(r => r.status === "PENDING").length} Guests`}
          subtext="awaiting table assignment"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="design-surface p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Loading operations & reservation queue...</span>
        </div>
      )}

      {/* 2 Column Operations Layout */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Today's Reservations */}
          <div className="lg:col-span-2 design-surface p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                  LIVE SERVICE
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  Today&apos;s reservations
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilterStatus(
                      filterStatus === "All"
                        ? "PENDING"
                        : filterStatus === "PENDING"
                        ? "CONFIRMED"
                        : filterStatus === "CONFIRMED"
                        ? "SEATED"
                        : "All"
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 h-8 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>Filter: {filterStatus}</span>
                </Button>
              </div>
            </div>

            {/* Reservation List */}
            <div className="divide-y divide-slate-100">
              {filteredReservations.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No reservations found.
                </div>
              ) : (
                filteredReservations.map((res) => {
                  const initials = res.customerName
                    ? res.customerName
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()
                    : "CU";

                  const timeStr = new Date(res.reservationTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={res.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/80 px-3 rounded-xl transition-colors gap-3"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono font-semibold text-slate-600 w-14">
                          {timeStr}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200/60 shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {res.customerName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {res.partySize} guests · {res.table?.tableNumber ? `Table ${res.table.tableNumber}` : "Unassigned"} · {res.customerPhone}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <StatusBadge status={res.status} />

                        {res.status === "PENDING" && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) handleConfirmReservation(res.id, e.target.value);
                            }}
                            defaultValue=""
                            className="text-xs px-2 py-1 border border-slate-200 rounded-lg bg-white"
                          >
                            <option value="" disabled>
                              Assign Table...
                            </option>
                            {tables.map((t) => (
                              <option key={t.id} value={t.id}>
                                Table {t.tableNumber}
                              </option>
                            ))}
                          </select>
                        )}

                        {res.status === "CONFIRMED" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(res.id, "SEATED")}
                            className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 rounded-lg"
                          >
                            <UserCheck className="w-3 h-3 mr-1" /> Seat Guest
                          </Button>
                        )}

                        {res.status !== "CANCELLED" && res.status !== "SEATED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(res.id, "CANCELLED")}
                            className="h-7 text-[11px] text-rose-600 hover:bg-rose-50 px-2 rounded-lg"
                          >
                            <XCircle className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Shift Checklist & Floor Plan Button */}
          <div className="design-surface p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                SHIFT CHECKLIST
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5 mb-6">
                Ready for service
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-slate-800">
                      Opening checks
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-400">
                    Done
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-slate-800">
                      Staff briefing
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-400">
                    Done
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold text-slate-800">
                      Table setup
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-blue-600">
                    {activeTablesCount} Active
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setIsFloorPlanOpen(true)}
              className="w-full py-3 h-11 rounded-xl bg-[#0a0e1a] hover:bg-black text-white text-xs font-semibold transition-all shadow-md border-none cursor-pointer"
            >
              Open floor plan ({tables.length} Tables)
            </Button>
          </div>
        </div>
      )}

      {/* Modal: New Booking */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title="Add New Table Booking"
        subtitle="Record phone or walk-in reservation."
      >
        <form onSubmit={handleCreateBookingSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Full Name *
            </label>
            <Input
              type="text"
              required
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              placeholder="e.g. Liam Carter"
              className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number *
              </label>
              <Input
                type="text"
                required
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Party Size (Guests) *
              </label>
              <Input
                type="number"
                min="1"
                required
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reservation Date & Time *
              </label>
              <Input
                type="datetime-local"
                required
                value={resTime}
                onChange={(e) => setResTime(e.target.value)}
                className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assign Table (Optional)
              </label>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                <option value="">Select table later...</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Table {t.tableNumber} ({t.capacity} seats)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Special Notes / Preferences
            </label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Window seat, anniversary"
              className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsBookingModalOpen(false)}
              className="px-4 py-2 h-9 rounded-xl text-xs font-semibold text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 h-9 rounded-xl bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold border-none cursor-pointer"
            >
              {isSubmitting ? "Submitting..." : "Confirm Booking"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Interactive Floor Plan */}
      <Modal
        isOpen={isFloorPlanOpen}
        onClose={() => setIsFloorPlanOpen(false)}
        title="Interactive Floor Plan — Live Telemetry"
        subtitle="Real-time statuses of dining tables."
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
            {tables.length === 0 ? (
              <div className="col-span-4 text-center py-6 text-slate-400 text-xs">
                No tables configured in database yet.
              </div>
            ) : (
              tables.map((table) => {
                const isOccupied = table.status === "OCCUPIED";
                const isReserved = table.status === "RESERVED";

                return (
                  <div
                    key={table.id}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      isOccupied
                        ? "bg-blue-50 border-blue-200 text-blue-900"
                        : isReserved
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <MapPin className="w-4 h-4 mb-1 opacity-70" />
                    <span className="font-bold text-sm">Table {table.tableNumber}</span>
                    <span className="text-[10px] opacity-75">{table.capacity} seats</span>
                    <span className="text-[9px] font-semibold mt-1 uppercase tracking-wider">
                      {table.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setIsFloorPlanOpen(false)}
              className="px-4 py-2 h-9 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl border-none cursor-pointer"
            >
              Close Floor Plan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
