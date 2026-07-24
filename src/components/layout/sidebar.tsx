"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  FileText,
  Settings,
  HelpCircle,
  ChevronDown,
  Globe,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Operations", href: "/operations", icon: ShoppingBag },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Staff", href: "/staff", icon: Users },
  { name: "Reports", href: "/reports", icon: FileText },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Hide sidebar on public marketing landing page & sign-in page
  if (pathname === "/landing" || pathname === "/signin") return null;

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
          "w-64 bg-[#0a0e1a] text-slate-400 flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-slate-900 select-none overflow-y-auto z-40 transition-transform duration-200 ease-in-out max-md:fixed max-md:inset-y-0 max-md:left-0",
          isMobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
        )}
      >
        {/* Top Header & Brand */}
        <div>
          <div className="p-6 flex items-center justify-between">
            <Link
              href="/"
              onClick={onMobileClose}
              className="flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-full bg-[#0052ff] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                M
              </div>
              <span className="font-display text-xl font-semibold tracking-tight text-white">
                Mise
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/landing"
                onClick={onMobileClose}
                title="Public Website"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors text-xs flex items-center gap-1"
              >
                <Globe className="w-3.5 h-3.5" />
              </Link>

              {/* Close Mobile Button */}
              <button
                onClick={onMobileClose}
                className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Workspace Navigation */}
          <div className="px-3 py-2">
            <div className="px-3 mb-3 text-[10px] font-mono font-semibold tracking-widest text-slate-500 uppercase">
              Workspace
            </div>

            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
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
        </div>

        {/* Bottom Section */}
        <div className="p-3 space-y-4">
          <div className="space-y-1 pt-4 border-t border-slate-900">
            <Link
              href="/settings"
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                pathname.startsWith("/settings")
                  ? "bg-slate-800/80 text-white border border-slate-700/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              )}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </Link>

            <Link
              href="/help"
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                pathname.startsWith("/help")
                  ? "bg-slate-800/80 text-white border border-slate-700/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              )}
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Help centre</span>
            </Link>
          </div>

          {/* User Profile & Logout Action Card */}
          <div className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30 shrink-0">
                AL
              </div>
              <div className="text-left truncate">
                <div className="text-xs font-semibold text-white leading-tight truncate">
                  {user?.name || "Avery Lin"}
                </div>
                <div className="text-[10px] text-slate-500 leading-tight truncate">
                  {user?.role || "General Manager"}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (onMobileClose) onMobileClose();
                logout();
              }}
              title="Sign out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
