"use client";

import React from "react";
import Link from "next/link";
import { Shield, ShoppingBag, DollarSign, ChevronRight } from "lucide-react";

export default function HelpPage() {
  const guides = [
    {
      icon: Shield,
      title: "Getting started",
      description: "Set up your restaurant and invite your team.",
      linkText: "Read guide",
    },
    {
      icon: ShoppingBag,
      title: "Operations guide",
      description: "Learn the best workflows for every service.",
      linkText: "Read guide",
    },
    {
      icon: DollarSign,
      title: "Understanding costs",
      description: "Make your margins more predictable.",
      linkText: "Read guide",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="text-[10px] font-mono font-semibold tracking-widest text-blue-600 uppercase mb-2">
          SUPPORT & RESOURCES
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
          Help centre
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Get answers, learn the product, and reach our hospitality team.
        </p>
      </div>

      {/* 3 Resource Cards matching Screenshot 4 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {guides.map((guide, idx) => {
          const Icon = guide.icon;
          return (
            <div
              key={idx}
              className="design-surface p-6 flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 mb-5 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>

                <h3 className="font-bold text-base text-slate-900 mb-1">
                  {guide.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  {guide.description}
                </p>
              </div>

              <button
                onClick={() => alert(`Opening ${guide.title}...`)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors self-start cursor-pointer"
              >
                <span>{guide.linkText}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Contact Support Card matching Screenshot 4 */}
      <div className="design-surface p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-8">
        <div>
          <div className="text-[10px] font-mono font-semibold tracking-widest text-slate-400 uppercase mb-2">
            NEED A HAND?
          </div>
          <p className="text-sm font-medium text-slate-600">
            Our team usually responds within one business day.
          </p>
        </div>

        <button
          onClick={() => alert("Opening support contact modal...")}
          className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          Contact support
        </button>
      </div>
    </div>
  );
}
