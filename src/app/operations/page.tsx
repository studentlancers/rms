"use client";

import React, { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { Plus, Filter, CheckCircle2, Clock, MapPin } from "lucide-react";

export default function OperationsPage() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");

  // Sample Reservation items
  const reservations = [
    {
      time: "12:00",
      initials: "SM",
      name: "Sophie Martin",
      details: "2 guests · T-04 · Anniversary",
      status: "Confirmed",
    },
    {
      time: "12:15",
      initials: "TW",
      name: "Thomas Wright",
      details: "4 guests · T-12 · Business",
      status: "Seated",
    },
    {
      time: "12:30",
      initials: "MP",
      name: "Maya Patel",
      details: "2 guests · T-07 · Window",
      status: "Confirmed",
    },
    {
      time: "12:45",
      initials: "HT",
      name: "Hiro Tanaka",
      details: "6 guests · T-18 · New guest",
      status: "Confirmed",
    },
    {
      time: "13:00",
      initials: "LC",
      name: "Liam Carter",
      details: "3 guests · T-09 · Birthday",
      status: "Waitlist",
    },
  ];

  const filteredReservations =
    filterStatus === "All"
      ? reservations
      : reservations.filter((r) => r.status === filterStatus);

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

        <button
          onClick={() => setIsBookingModalOpen(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New booking</span>
        </button>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="COVERS TODAY"
          value="186 / 220"
          subtext="↗ 8.7% vs last week"
        />
        <StatCard
          label="TABLES ACTIVE"
          value="14 / 24"
          subtext="↗ Lunch service"
        />
        <StatCard
          label="AVERAGE WAIT"
          value="12 min"
          subtext="↗ 3 min faster"
        />
      </div>

      {/* 2 Column Operations Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Today's Reservations (Span 2) */}
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
              <button
                onClick={() =>
                  setFilterStatus(
                    filterStatus === "All"
                      ? "Confirmed"
                      : filterStatus === "Confirmed"
                      ? "Seated"
                      : filterStatus === "Seated"
                      ? "Waitlist"
                      : "All"
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter: {filterStatus}</span>
              </button>
            </div>
          </div>

          {/* Reservation List */}
          <div className="divide-y divide-slate-100">
            {filteredReservations.map((res, i) => (
              <div
                key={i}
                className="py-4 flex items-center justify-between hover:bg-slate-50/80 px-3 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono font-semibold text-slate-600 w-12">
                    {res.time}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200/60">
                    {res.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {res.name}
                    </div>
                    <div className="text-xs text-slate-400">{res.details}</div>
                  </div>
                </div>

                <StatusBadge status={res.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Shift Checklist */}
        <div className="design-surface p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
              SHIFT CHECKLIST
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5 mb-6">
              Ready for service
            </h3>

            {/* Checklist items */}
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
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-800">
                    Prep completion
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-slate-400">
                  Pending
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-800">
                    Table setup
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-slate-400">
                  Pending
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsFloorPlanOpen(true)}
            className="w-full py-3 rounded-xl bg-[#0a0e1a] hover:bg-black text-white text-xs font-semibold transition-all shadow-md"
          >
            Open floor plan
          </button>
        </div>
      </div>

      {/* Modal: New Booking */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title="Add Operations Booking"
        subtitle="Quickly assign a table and seat guests."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Guest Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Liam Carter"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Table
              </label>
              <input
                type="text"
                placeholder="e.g. T-09"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20">
                <option value="Confirmed">Confirmed</option>
                <option value="Seated">Seated</option>
                <option value="Waitlist">Waitlist</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              onClick={() => setIsBookingModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert("Operations reservation saved!");
                setIsBookingModalOpen(false);
              }}
              className="px-5 py-2 rounded-xl bg-[#0052ff] text-white text-xs font-semibold shadow-sm"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Floor Plan Interactive View */}
      <Modal
        isOpen={isFloorPlanOpen}
        onClose={() => setIsFloorPlanOpen(false)}
        title="Interactive Floor Plan — Main Dining Room"
        subtitle="Live status of active and available dining tables."
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
            {[
              { id: "T-01", seats: 2, status: "Active" },
              { id: "T-02", seats: 4, status: "Active" },
              { id: "T-03", seats: 2, status: "Free" },
              { id: "T-04", seats: 6, status: "Active" },
              { id: "T-05", seats: 4, status: "Reserved" },
              { id: "T-06", seats: 2, status: "Active" },
              { id: "T-07", seats: 4, status: "Active" },
              { id: "T-08", seats: 8, status: "Free" },
            ].map((table) => (
              <div
                key={table.id}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  table.status === "Active"
                    ? "bg-blue-50 border-blue-200 text-blue-900"
                    : table.status === "Reserved"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <MapPin className="w-4 h-4 mb-1 opacity-70" />
                <span className="font-bold text-sm">{table.id}</span>
                <span className="text-[10px] opacity-75">{table.seats} seats</span>
                <span className="text-[9px] font-semibold mt-1 uppercase tracking-wider">
                  {table.status}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setIsFloorPlanOpen(false)}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
            >
              Close Floor Plan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
