"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  FileText,
  Settings,
  HelpCircle,
  Globe,
  X,
  UtensilsCrossed,
  Receipt,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import { OrganizationSwitcher } from "@/components/auth/organization/organization-switcher";
import { UserButton } from "@/components/auth/user/user-button";
import { useAuth } from "@/hooks/use-auth";

const rawNavigationItems = [
  { name: "Overview", path: "", icon: LayoutDashboard },
  { name: "Operations", path: "/operations", icon: ShoppingBag },
  { name: "Inventory", path: "/inventory", icon: Package },
  { name: "Expenses", path: "/expenses", icon: Receipt },
  { name: "Menu & Billing", path: "/menu", icon: UtensilsCrossed },
  { name: "Staff", path: "/staff", icon: Users },
  { name: "Reports", path: "/reports", icon: FileText },
];

const staffItems = [
  { name: "Dashboard", href: "/staff", icon: LayoutDashboard },
  { name: "Inventory", href: "/staff/inventory", icon: Package },
  { name: "Menu & Billing", href: "/staff/menu", icon: UtensilsCrossed },
  { name: "Tables", href: "/staff/tables", icon: Users },
  { name: "Logout", href: "/signin", icon: LogOut },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const { activeOrg } = useAuth();

  const isStaffRoute = pathname.startsWith("/staff");
  const slug = (params?.slug as string) || activeOrg?.slug || "restaurant";
  const basePath = `/dashboard/${slug}`;

  const navigationItems = isStaffRoute
    ? staffItems
    : rawNavigationItems.map((item) => ({
        name: item.name,
        href: `${basePath}${item.path}`,
        icon: item.icon,
      }));

  // Hide sidebar on public marketing landing page, sign-in page & onboarding page
  if (
    pathname === "/landing" ||
    pathname === "/signin" ||
    pathname.startsWith("/onboarding")
  )
    return null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="md:hidden fixed inset-0 bg-slate-950/60 z-30 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "w-64 bg-[#0a0e1a] text-slate-400 flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-slate-900 select-none overflow-hidden z-40 transition-transform duration-200 ease-in-out max-md:fixed max-md:inset-y-0 max-md:left-0",
          isMobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
        )}
      >
        {/* Top Header & Brand Section */}
        <div className="shrink-0">
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Link
                href={isStaffRoute ? "/staff" : basePath}
                onClick={onMobileClose}
                className="flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-[#0052ff] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  M
                </div>
                <span className="font-display text-xl font-semibold tracking-tight text-white">
                  Mise
                </span>
              </Link>

              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Link
                        href="/landing"
                        onClick={onMobileClose}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </Link>
                    }
                  />
                  <TooltipContent side="bottom" className="text-xs">
                    Public Website
                  </TooltipContent>
                </Tooltip>

                {/* Close Mobile Button */}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onMobileClose}
                  className="md:hidden text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Better Auth UI Organization Switcher with custom dark theme styling */}
            <div className="dark">
              <OrganizationSwitcher
                className="w-full justify-between bg-slate-900/90 hover:bg-slate-800/90 text-slate-100 border border-slate-800/80 rounded-xl px-3 py-2 text-left shadow-xs transition-colors"
                align="start"
                side="bottom"
                sideOffset={6}
                hidePersonal
              />
            </div>
          </div>

          <Separator className="bg-slate-900" />
        </div>

        {/* Workspace Navigation */}
        <div className="px-3 py-3 flex-1 overflow-y-auto min-h-0">
          <div className="px-3 mb-3 text-[10px] font-mono font-semibold tracking-widest text-slate-500 uppercase">
            {isStaffRoute ? "Staff Workspace" : "Workspace"}
          </div>

          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/staff"
                  ? pathname === "/staff"
                  : item.href === basePath
                  ? pathname === basePath ||
                    pathname === `${basePath}/dashboard` ||
                    pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-slate-800/80 text-white shadow-sm border border-slate-700/50"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      isActive ? "text-white" : "text-slate-400"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-3 space-y-4 shrink-0">
          {!isStaffRoute && (
            <div className="space-y-1 pt-3 border-t border-slate-900">
              <Link
                href={`${basePath}/settings`}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  pathname.startsWith(`${basePath}/settings`)
                    ? "bg-slate-800/80 text-white border border-slate-700/50"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                )}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </Link>

              <Link
                href={`${basePath}/help`}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  pathname.startsWith(`${basePath}/help`)
                    ? "bg-slate-800/80 text-white border border-slate-700/50"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                )}
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Help centre</span>
              </Link>
            </div>
          )}

          <Separator className="bg-slate-800/60" />

          {/* Better Auth UI User Profile & Logout Action Card */}
          <div className="dark w-full">
            <UserButton
              className="w-full justify-between bg-slate-900/90 hover:bg-slate-800/90 text-slate-100 border border-slate-800/80 rounded-xl px-3 py-2.5 shadow-xs transition-colors text-left font-normal"
              align="start"
              
              sideOffset={8}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
