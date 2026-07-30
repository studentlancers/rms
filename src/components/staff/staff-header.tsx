"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  Bell,
  Clock,
  UtensilsCrossed,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StaffHeaderProps {
  onMobileMenuToggle: () => void;
}

export default function StaffHeader({ onMobileMenuToggle }: StaffHeaderProps) {
  const [timeString, setTimeString] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 md:px-8 flex items-center justify-between shrink-0 shadow-2xs z-30">
      {/* Left: Mobile Toggle & Status */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
          className="md:hidden text-slate-600 hover:text-slate-900"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200/80 px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Shift Active</span>
            <span className="text-emerald-400 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-emerald-600">Main Dining</span>
          </Badge>

          <span className="text-xs text-slate-400 font-medium hidden lg:inline">
            Grand Bistro — Floor 1
          </span>
        </div>
      </div>

      {/* Right: Quick POS, Notifications, Live Clock */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Live Clock */}
        <div className="hidden sm:flex items-center gap-1.5 text-slate-500 text-xs font-mono font-medium bg-slate-100/80 px-3 py-1.5 rounded-md border border-slate-200/60">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{timeString || "12:00 PM"}</span>
        </div>

        {/* Quick POS Shortcut */}
        <Link href="/staff/menu">
          <Button
            size="sm"
            className="bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-xs gap-1.5 rounded-lg px-3.5"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open POS</span>
          </Button>
        </Link>

        {/* Notifications Icon */}
        <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
