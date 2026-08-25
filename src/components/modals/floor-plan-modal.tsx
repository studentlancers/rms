"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Users, UtensilsCrossed, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { listTables } from "@/actions/tables";
import { toast } from "sonner";

interface FloorPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FloorPlanModal({ isOpen, onClose }: FloorPlanModalProps) {
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTables = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await listTables();
      setTables(data || []);
    } catch (err: any) {
      console.error("Error loading floor plan tables:", err);
      if (!silent) toast.error("Failed to load table telemetry");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTables();
      const interval = setInterval(() => {
        fetchTables(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const freeCount = tables.filter((t) => t.status === "FREE").length;
  const occupiedCount = tables.filter((t) => t.status === "OCCUPIED").length;
  const reservedCount = tables.filter((t) => t.status === "RESERVED").length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Live Floor Plan & Table Telemetry"
      subtitle="Real-time status of all dining room tables powered by PostgreSQL database."
      className="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Status Legend & Summary Cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase block">TOTAL TABLES</span>
            <span className="text-xl font-bold text-slate-900 font-mono">{tables.length}</span>
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-center">
            <span className="text-[10px] font-mono font-semibold text-emerald-600 uppercase block">AVAILABLE (FREE)</span>
            <span className="text-xl font-bold text-emerald-700 font-mono">{freeCount}</span>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-xl text-center">
            <span className="text-[10px] font-mono font-semibold text-blue-600 uppercase block">OCCUPIED</span>
            <span className="text-xl font-bold text-blue-700 font-mono">{occupiedCount}</span>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-center">
            <span className="text-[10px] font-mono font-semibold text-amber-600 uppercase block">RESERVED</span>
            <span className="text-xl font-bold text-amber-700 font-mono">{reservedCount}</span>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Fetching PostgreSQL table telemetry...</span>
          </div>
        )}

        {/* Tables Grid */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto pr-1">
            {tables.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                No tables found in database. Add tables from the Table Management console.
              </div>
            ) : (
              tables.map((table) => {
                const activeOrder = table.orders?.[0];
                const activeReservation = table.reservations?.[0];

                return (
                  <div
                    key={table.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all flex flex-col justify-between min-h-[140px] relative overflow-hidden",
                      table.status === "FREE"
                        ? "bg-white border-emerald-200 shadow-2xs hover:border-emerald-300"
                        : table.status === "OCCUPIED"
                        ? "bg-blue-50/40 border-blue-200 shadow-2xs hover:border-blue-300"
                        : "bg-amber-50/40 border-amber-200 shadow-2xs hover:border-amber-300"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-display font-bold text-lg text-slate-900">
                          Table {table.tableNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border",
                            table.status === "FREE"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : table.status === "OCCUPIED"
                              ? "bg-blue-50 text-blue-600 border-blue-200"
                              : "bg-amber-50 text-amber-600 border-amber-200"
                          )}
                        >
                          {table.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Capacity: <strong>{table.capacity} guests</strong></span>
                      </div>
                    </div>

                    {/* Active Order / Reservation Telemetry */}
                    <div className="pt-2 border-t border-slate-100/80 text-[11px] font-medium text-slate-600">
                      {table.status === "OCCUPIED" && activeOrder && (
                        <div className="flex items-center gap-1.5 text-blue-700 font-semibold truncate">
                          <UtensilsCrossed className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="truncate">Order ₹{activeOrder.total?.toFixed(0)}</span>
                        </div>
                      )}

                      {table.status === "RESERVED" && activeReservation && (
                        <div className="flex items-center gap-1.5 text-amber-700 font-semibold truncate">
                          <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate">{activeReservation.customerName}</span>
                        </div>
                      )}

                      {table.status === "FREE" && (
                        <span className="text-emerald-600 font-medium">Ready for guests</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => fetchTables()}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Table Telemetry</span>
          </button>

          <Button
            onClick={onClose}
            className="px-5 py-2 h-9 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl border-none cursor-pointer"
          >
            Close Floor Plan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
