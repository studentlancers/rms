"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const navItems = [
  {
    name: "Overview",
    href: "/super-admin",
    icon: LayoutDashboard,
  },
  {
    name: "Organizations",
    href: "/super-admin/organizations",
    icon: Building2,
  },
  {
    name: "Users Directory",
    href: "/super-admin/users",
    icon: Users,
  },
  {
    name: "Platform Reports",
    href: "/super-admin/reports",
    icon: BarChart3,
  },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out of Super Admin portal");
      router.push("/signin");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#fafafa] text-slate-900 font-sans">
      {/* Super Admin Fixed Sidebar (Matches Normal User Dark Sidebar Aesthetic) */}
      <aside className="w-64 h-screen border-r border-slate-900 bg-[#0a0e1a] text-slate-400 flex flex-col justify-between shrink-0 sticky top-0 select-none overflow-hidden z-40">
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Brand & Header Section */}
          <div className="flex items-center justify-between">
            <Link href="/super-admin" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-full bg-[#0052ff] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                M
              </div>
              <div>
                <span className="font-display text-xl font-semibold tracking-tight text-white block leading-none">
                  Mise
                </span>
                <span className="text-[9px] font-mono font-bold text-blue-400 tracking-wider uppercase block mt-0.5">
                  SUPER ADMIN
                </span>
              </div>
            </Link>

            <Link
              href="/landing"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="Public Website"
            >
              <Globe className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-px bg-slate-900" />

          {/* Navigation Menu */}
          <div>
            <div className="px-3 mb-3 text-[10px] font-mono font-semibold tracking-widest text-slate-500 uppercase">
              Platform Control
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/super-admin"
                    ? pathname === "/super-admin"
                    : pathname.startsWith(item.href);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                      isActive
                        ? "bg-slate-800/80 text-white shadow-sm border border-slate-700/50"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer Identity & Sign Out */}
        <div className="p-3 space-y-3 shrink-0">
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-slate-200 uppercase">
                Super Admin Active
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Platform System Administrator</p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl border border-rose-900/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area (Matches Light Normal User Header & Surface Theme) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="w-full bg-[#fafafa] px-8 py-4 flex items-center justify-between border-b border-slate-200/60 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>SUPER ADMIN</span>
            <span>/</span>
            <span className="text-slate-900 font-bold uppercase">
              {pathname === "/super-admin"
                ? "OVERVIEW"
                : pathname.replace("/super-admin/", "").replaceAll("-", " ")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-600 font-mono text-[10px] font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>SUPER ADMIN PORTAL</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto min-h-0 bg-[#fafafa]">{children}</main>
      </div>
    </div>
  );
}
