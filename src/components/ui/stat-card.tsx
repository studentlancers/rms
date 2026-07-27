import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "design-surface p-5 flex flex-col justify-between transition-all hover:shadow-md border-border bg-white",
        className
      )}
    >
      <CardContent className="p-0 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
            {label}
          </span>
          <button className="text-slate-300 hover:text-slate-500 font-bold text-xs tracking-widest px-1">
            •••
          </button>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            {value}
          </div>

          {trend && (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                trend.isPositive !== false
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200/50"
                  : "bg-rose-50 text-rose-500 border border-rose-200/50"
              )}
            >
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        {subtext && (
          <div className="text-xs text-slate-400 font-normal mt-1.5">
            {subtext}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

