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
      title="Floor Plan"
      subtitle="Real-time dining room status and table telemetry."
      className="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Small status summary header */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-slate-500 font-semibold uppercase">
              TOTAL: <strong className="text-slate-900 font-bold">{tables.length}</strong>
            </span>
            <div className="h-3.5 w-px bg-slate-200" />
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-700 font-semibold uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              FREE: <strong className="font-bold">{freeCount}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-blue-700 font-semibold uppercase">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              OCCUPIED: <strong className="font-bold">{occupiedCount}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-amber-700 font-semibold uppercase">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              RESERVED: <strong className="font-bold">{reservedCount}</strong>
            </span>
          </div>

          <button
            onClick={() => fetchTables()}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
            title="Refresh tables"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Fetching table telemetry...</span>
          </div>
        )}

        {/* Compact Table Grid */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {tables.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs">
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
                      "p-3 rounded-xl border transition-all flex flex-col justify-between min-h-[96px] relative overflow-hidden",
                      table.status === "FREE"
                        ? "bg-white border-emerald-200/90 shadow-2xs hover:border-emerald-300"
                        : table.status === "OCCUPIED"
                        ? "bg-blue-50/50 border-blue-200 shadow-2xs hover:border-blue-300"
                        : "bg-amber-50/50 border-amber-200 shadow-2xs hover:border-amber-300"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-display font-bold text-sm text-slate-900">
                          TABLE {table.tableNumber.padStart(2, "0")}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-1.5 py-0 text-[9px] font-bold uppercase rounded-full border shrink-0",
                            table.status === "FREE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : table.status === "OCCUPIED"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          )}
                        >
                          {table.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Users className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Capacity: <strong className="text-slate-700">{table.capacity}</strong></span>
                      </div>
                    </div>

                    {/* Secondary Indicator: Order or Reservation */}
                    <div className="pt-2 border-t border-slate-100 text-[10px] font-medium text-slate-600 mt-2">
                      {table.status === "OCCUPIED" && activeOrder ? (
                        <div className="flex items-center gap-1 text-blue-700 font-semibold truncate">
                          <UtensilsCrossed className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="truncate">Order: ₹{activeOrder.total?.toFixed(0)}</span>
                        </div>
                      ) : table.status === "RESERVED" && activeReservation ? (
                        <div className="flex items-center gap-1 text-amber-700 font-semibold truncate">
                          <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate">{activeReservation.customerName}</span>
                        </div>
                      ) : (
                        <span className="text-emerald-600 font-medium">Available</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <Button
            onClick={onClose}
            className="px-4 py-2 h-8 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl border-none cursor-pointer"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
