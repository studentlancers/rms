import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "Confirmed"
  | "Seated"
  | "Waitlist"
  | "Low"
  | "Healthy"
  | "On shift"
  | "On break"
  | "Scheduled"
  | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStyles = () => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-blue-50/80 text-blue-600 border-blue-200/60";
      case "seated":
      case "healthy":
      case "on shift":
      case "available":
      case "ready":
      case "completed":
      case "delivered":
      case "done":
      case "in stock":
        return "bg-emerald-50/80 text-emerald-600 border-emerald-200/60";
      case "waitlist":
      case "on break":
      case "occupied":
      case "reserved":
      case "preparing":
      case "in progress":
      case "low stock":
        return "bg-amber-50/80 text-amber-600 border-amber-200/60";
      case "low":
      case "urgent":
      case "cleaning":
      case "billing":
      case "warning":
      case "out of stock":
      case "incomplete":
      case "cancelled":
        return "bg-rose-50/80 text-rose-600 border-rose-200/60";
      case "pending":
      case "scheduled":
      default:
        return "bg-slate-100 text-slate-500 border-slate-200/60";
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-colors",
        getStyles(),
        className
      )}
    >
      {status}
    </Badge>
  );
}

