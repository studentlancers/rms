"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // On standalone pages (landing & signin), render children directly without app shell padding or sidebars
  const isStandalone = pathname === "/landing" || pathname === "/signin";

  if (isStandalone) {
    return (
      <div className="h-screen w-screen overflow-x-hidden overflow-y-auto bg-white">
        {children}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#fafafa] text-slate-900 font-sans relative">
      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onMobileMenuToggle={() => setIsMobileOpen(!isMobileOpen)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto min-h-0 overflow-x-hidden max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
