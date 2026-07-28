"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Menu,
  AlertTriangle,
  CheckCircle,
  Info,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";


import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";

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
  dateText,
  venueText,
  onFloorPlanClick,
  onMobileMenuToggle,
}: HeaderProps) {
  const pathname = usePathname();
  const { activeOrg } = useAuth()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const displayDate =
    dateText ||
    new Date()
      .toLocaleDateString("en-US", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
      .toUpperCase();

  const displayVenue =
    venueText ||
    `${activeOrg?.name || "My Restaurant"} · Main Operations`;

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

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, unread: false }))
    );
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Hide top app header on public marketing landing page, sign-in page & onboarding page
  if (
    pathname === "/landing" ||
    pathname === "/signin" ||
    pathname.startsWith("/onboarding")
  )
    return null;

  return (
    <header className="w-full bg-[#fafafa] px-4 md:px-8 py-4 md:py-5 flex items-center justify-between border-b border-slate-200/60 sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Menu Toggle Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onMobileMenuToggle}
          className="md:hidden rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-4 h-4" />
        </Button>

        <div>
          <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase truncate">
            {displayDate}
          </div>
          <div className="text-xs md:text-sm font-medium text-slate-800 mt-0.5 truncate">
            {displayVenue}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Floor Plan Button */}
        <Button
          onClick={onFloorPlanClick || (() => alert("Opening floor plan..."))}
          className="bg-black hover:bg-slate-900 text-white text-xs font-semibold px-3.5 md:px-4 h-9 rounded-full shadow-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          View floor plan
        </Button>

        {/* Notification Bell Icon & Popover */}
        <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
          <PopoverTrigger
            className={cn(
              "relative rounded-full border bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-2xs cursor-pointer shrink-0 inline-flex items-center justify-center size-9",
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
          </PopoverTrigger>

          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-80 md:w-96 p-0 bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Popover Header */}
            <div className="p-4 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full px-2 py-0.5 h-auto"
                  >
                    {unreadCount} new
                  </Badge>
                )}
              </div>

              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:bg-blue-50/60 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Read all</span>
                </Button>
              )}
            </div>

            <Separator />

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
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
