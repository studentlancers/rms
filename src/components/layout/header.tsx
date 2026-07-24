"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Menu,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  type: "warning" | "success" | "info";
}

interface HeaderProps {
  dateText?: string;
  venueText?: string;
  onFloorPlanClick?: () => void;
  onMobileMenuToggle?: () => void;
}

export default function Header({
  dateText = "THURSDAY, 08 FEBRUARY 2024",
  venueText = "The Langham · Main dining room",
  onFloorPlanClick,
  onMobileMenuToggle,
}: HeaderProps) {
  const pathname = usePathname();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "Low Inventory Alert",
      description: "Atlantic salmon is below threshold (3.2 kg remaining).",
      time: "2 min ago",
      unread: true,
      type: "warning",
    },
    {
      id: "2",
      title: "Shift Roster Confirmed",
      description: "Maya Patel confirmed on-shift for Lunch Peak service.",
      time: "10 min ago",
      unread: true,
      type: "success",
    },
    {
      id: "3",
      title: "Mise AI Forecast",
      description: "+18% bump in 2-top covers predicted at 12:30 PM today.",
      time: "25 min ago",
      unread: false,
      type: "info",
    },
  ]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationsOpen]);

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, unread: false }))
    );
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Hide top app header on public marketing landing page & sign-in page
  if (pathname === "/landing" || pathname === "/signin") return null;

  return (
    <header className="w-full bg-[#fafafa] px-4 md:px-8 py-4 md:py-5 flex items-center justify-between border-b border-slate-200/60 sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Menu Toggle Button */}
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div>
          <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase truncate">
            {dateText}
          </div>
          <div className="text-xs md:text-sm font-medium text-slate-800 mt-0.5 truncate">
            {venueText}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Notification Bell & Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={cn(
              "relative p-2 rounded-full border bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-2xs cursor-pointer shrink-0",
              isNotificationsOpen
                ? "border-blue-500 ring-2 ring-blue-500/20 text-blue-600"
                : "border-slate-200"
            )}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notification Dropdown Popover */}
          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Dropdown Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Read all</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Notification Cards List */}
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      setNotifications((prev) =>
                        prev.map((n) =>
                          n.id === item.id ? { ...n, unread: false } : n
                        )
                      )
                    }
                    className={cn(
                      "p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer",
                      item.unread ? "bg-blue-50/30" : "bg-white"
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border",
                        item.type === "warning"
                          ? "bg-amber-50 text-amber-600 border-amber-200/60"
                          : item.type === "success"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                          : "bg-blue-50 text-blue-600 border-blue-200/60"
                      )}
                    >
                      {item.type === "warning" ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : item.type === "success" ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Info className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-normal line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {item.unread && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onFloorPlanClick || (() => alert("Opening floor plan..."))}
          className="bg-black hover:bg-slate-900 text-white text-xs font-semibold px-3.5 md:px-4 py-2 rounded-full transition-all shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          View floor plan
        </button>
      </div>
    </header>
  );
}
