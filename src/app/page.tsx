"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { Modal } from "@/components/ui/modal";
import { Plus, ChevronDown, Sparkles, ChevronRight, Settings2 } from "lucide-react";

export default function OverviewPage() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);

  // Form state for New Booking
  const [guestName, setGuestName] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [time, setTime] = useState("12:30");
  const [notes, setNotes] = useState("");

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Booking created for ${guestName} (${partySize} guests at ${time})`);
    setIsBookingModalOpen(false);
    setGuestName("");
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">LIVE SERVICE</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Good morning, Avery.
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here&apos;s how your restaurant is performing today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors">
            <span>Today</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New booking</span>
          </button>
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="SALES TODAY"
          value="$8,426.80"
          subtext="vs. last Thursday"
          trend={{ value: "↗ +12.4%", isPositive: true }}
        />
        <StatCard
          label="COVERS SERVED"
          value="186"
          subtext="of 220 target"
          trend={{ value: "↗ +8.7%", isPositive: true }}
        />
        <StatCard
          label="AVERAGE CHECK"
          value="$45.31"
          subtext="vs. last Thursday"
          trend={{ value: "↘ -2.1%", isPositive: false }}
        />
      </div>

      {/* Middle Row: Revenue Performance + Mise Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Revenue Performance Chart Card (Span 2) */}
        <div className="lg:col-span-2 design-surface p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                REVENUE PERFORMANCE
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold tracking-tight text-slate-900">
                  $42,860
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                  ↗ 14.8%
                </span>
              </div>
            </div>

            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              <span>This week</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* SVG Wave Chart */}
          <div className="relative h-48 w-full pt-4">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 500 120"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0052ff" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0052ff" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1="0"
                y1="30"
                x2="500"
                y2="30"
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <line
                x1="0"
                y1="75"
                x2="500"
                y2="75"
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />

              {/* Area Fill */}
              <path
                d="M 0 90 Q 40 70 80 80 T 160 50 T 240 65 T 320 20 T 400 60 T 480 10 L 480 120 L 0 120 Z"
                fill="url(#chartGradient)"
              />

              {/* Wave Curve */}
              <path
                d="M 0 90 Q 40 70 80 80 T 160 50 T 240 65 T 320 20 T 400 60 T 480 10"
                fill="none"
                stroke="#0052ff"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data Point Marker on Friday peak */}
              <circle
                cx="420"
                cy="42"
                r="5"
                fill="#ffffff"
                stroke="#0052ff"
                strokeWidth="3.5"
                className="shadow-md"
              />
            </svg>

            {/* X Axis Labels */}
            <div className="flex justify-between text-[10px] font-mono font-medium text-slate-400 mt-2 px-1">
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
              <span>SUN</span>
            </div>
          </div>
        </div>

        {/* Mise Intelligence Dark Card */}
        <div className="design-inverted-section design-dot-grid p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden border border-slate-800 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 rounded-xl bg-slate-800/90 text-blue-400 flex items-center justify-center border border-slate-700">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-semibold tracking-widest text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-800/40">
                MISE INTELLIGENCE
              </span>
            </div>

            <h3 className="font-display text-2xl font-semibold text-white leading-tight mt-2">
              Your lunch service is looking{" "}
              <span className="text-[#4d7cff]">strong.</span>
            </h3>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Guest volume is trending ahead of forecast. Schedule one more
              runner before the 12:30 peak.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-slate-400 tracking-wider">
                FORECASTED COVERS
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                98 <span className="text-xs font-normal text-slate-400">by 2:00 PM</span>
              </div>
            </div>

            <button
              onClick={() => setIsInsightsModalOpen(true)}
              className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold px-4 py-2 rounded-full transition-all shadow-sm"
            >
              View insights
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Today's Arrivals + Inventory Watch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Arrivals (Span 2) */}
        <div className="lg:col-span-2 design-surface p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                TODAY&apos;S ARRIVALS
              </div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                Lunch reservations <span className="text-xs font-normal text-slate-400">· 24 covers</span>
              </div>
            </div>

            <Link
              href="/operations"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <span>All bookings</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Table / List */}
          <div className="divide-y divide-slate-100">
            {[
              {
                time: "12:00",
                initials: "SM",
                name: "Sophie Martin",
                guests: "2 guests",
                tag: "Anniversary",
                table: "T-84",
              },
              {
                time: "12:15",
                initials: "TW",
                name: "Thomas Wright",
                guests: "4 guests",
                tag: "Business",
                table: "T-12",
              },
              {
                time: "12:30",
                initials: "MP",
                name: "Maya Patel",
                guests: "2 guests",
                tag: "Window",
                table: "T-87",
              },
              {
                time: "12:45",
                initials: "HT",
                name: "Hiro Tanaka",
                guests: "6 guests",
                tag: "New guest",
                table: "T-18",
              },
            ].map((res, i) => (
              <div
                key={i}
                className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono font-semibold text-slate-600 w-12">
                    {res.time}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200">
                    {res.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {res.name}
                    </div>
                    <div className="text-xs text-slate-400">{res.guests}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {res.tag}
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                    {res.table}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Watch */}
        <div className="design-surface p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                  INVENTORY WATCH
                </div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  Low stock items
                </div>
              </div>

              <Link
                href="/inventory"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                View all
              </Link>
            </div>

            {/* Inventory progress items */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1.5">
                  <span>Atlantic salmon</span>
                  <span className="text-slate-400 font-normal">3.2 kg left</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full w-[18%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1.5">
                  <span>Burrata di Puglia</span>
                  <span className="text-slate-400 font-normal">8 portions left</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full w-[32%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1.5">
                  <span>Domaine des Hâtes</span>
                  <span className="text-slate-400 font-normal">14 bottles left</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[69%]" />
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/inventory"
            className="w-full mt-6 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all shadow-2xs"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Manage inventory</span>
          </Link>
        </div>
      </div>

      {/* Modal: New Booking */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title="New Reservation"
        subtitle="Create a new guest booking for today's service."
      >
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Guest Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Avery Lin"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Party Size
              </label>
              <select
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Special Notes / Tag
            </label>
            <input
              type="text"
              placeholder="e.g. Window table, Anniversary"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBookingModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0052ff] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
            >
              Save Reservation
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Mise Intelligence Insights */}
      <Modal
        isOpen={isInsightsModalOpen}
        onClose={() => setIsInsightsModalOpen(false)}
        title="Mise Intelligence Analysis"
        subtitle="AI Service Forecast & Demand Insights"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50/60 border border-blue-200/60 rounded-xl text-xs text-blue-900 space-y-2">
            <div className="font-semibold text-blue-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Demand Forecast Peak: 12:30 PM – 1:45 PM</span>
            </div>
            <p>
              Historical weather and reservation trends indicate a +18% bump in 2-top covers. Staffing recommendation: allocate 1 extra floor runner.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-800">Forecast Summary</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="text-slate-400">Total Expected Covers</div>
                <div className="text-lg font-bold text-slate-900">98 covers</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="text-slate-400">Estimated Turnover</div>
                <div className="text-lg font-bold text-slate-900">42 mins avg</div>
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              onClick={() => setIsInsightsModalOpen(false)}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl"
            >
              Close Insights
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
