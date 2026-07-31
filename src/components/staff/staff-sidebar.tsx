"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  UtensilsCrossed,
  LayoutGrid,
  LogOut,
  X,
  ChefHat,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const staffNavigationItems = [
  { name: "Dashboard", href: "/staff", icon: LayoutDashboard },
  { name: "Inventory", href: "/staff/inventory", icon: Package },
  { name: "Menu & Billing", href: "/staff/menu", icon: UtensilsCrossed },
  { name: "Tables", href: "/staff/tables", icon: LayoutGrid },
];

interface StaffSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function StaffSidebar({
  isMobileOpen = false,
  onMobileClose,
}: StaffSidebarProps) {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === "/staff") {
      return pathname === "/staff";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0e1a] text-slate-300 flex flex-col border-r border-slate-800/80 transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-auto h-screen shrink-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header / Brand */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/60 shrink-0">
          <Link
            href="/staff"
            className="flex items-center gap-3 group"
            onClick={onMobileClose}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display text-lg font-bold text-white tracking-tight block leading-none">
                Mise
              </span>
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block mt-0.5">
                Staff Workspace
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="md:hidden text-slate-400 hover:text-white hover:bg-slate-800/60"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto min-h-0 custom-scrollbar">
          <div className="px-3 pb-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Staff Navigation
            </span>
          </div>

          {staffNavigationItems.map((item) => {
            const active = isLinkActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    active ? "text-white" : "text-slate-400 group-hover:text-white"
                  )}
                />
                <span>{item.name}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Fixed Bottom Profile & Logout Section */}
        <div className="p-3 border-t border-slate-800/80 bg-[#070a14] shrink-0 space-y-2">
          {/* Profile Card */}
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                AR
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0a0e1a]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-white truncate">
                  Alex Rivera
                </span>
                <BadgeCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                Shift Manager & Cashier
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <Link
            href="/signin"
            onClick={onMobileClose}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
