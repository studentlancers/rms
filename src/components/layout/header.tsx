"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";

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
        <button
          className="relative p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs cursor-pointer shrink-0"
          aria-label="Notifications"
          onClick={() => alert("No new notifications")}
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full ring-2 ring-white"></span>
        </button>

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
