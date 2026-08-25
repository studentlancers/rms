"use client";

import React from "react";
import Link from "next/link";
import { Shield, ShoppingBag, DollarSign, ChevronRight, Mail, MessageSquare } from "lucide-react";

export default function HelpPage() {
  const guides = [
    {
      icon: Shield,
      title: "Getting started",
      description: "Set up your restaurant, menu, tables, and staff team.",
      linkText: "Read guide",
    },
    {
      icon: ShoppingBag,
      title: "Reservations & Operations",
      description: "Learn how to manage table bookings, floor status, and active orders.",
      linkText: "Read guide",
    },
    {
      icon: DollarSign,
      title: "Billing & Margin Control",
      description: "Understand tax rates, charges, splitting fees, and daily checks.",
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
          Help Centre
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Get answers, learn the product, and contact Student Lancer support team.
        </p>
      </div>

      {/* 3 Resource Cards */}
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
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors self-start cursor-pointer border-none bg-transparent p-0"
              >
                <span>{guide.linkText}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Student Lancer Contact Support Section */}
      <div className="design-surface p-8 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
        <div>
          <div className="text-[10px] font-mono font-semibold tracking-widest text-blue-600 uppercase mb-1">
            STUDENT LANCER SUPPORT
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Need direct technical assistance?
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Student Lancer contact details are ready for instant support via Email or WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="mailto:support@studentlancer.com"
            className="p-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex items-center gap-4 group no-underline text-slate-900"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60 group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-semibold text-slate-400 uppercase">EMAIL SUPPORT</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">support@studentlancer.com</div>
              <div className="text-[11px] text-blue-600 font-medium mt-1">Send Email &rarr;</div>
            </div>
          </a>

          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/70 transition-all flex items-center gap-4 group no-underline text-slate-900"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-300/60 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-semibold text-emerald-600 uppercase">WHATSAPP SUPPORT</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">+91 98765 43210</div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">Chat on WhatsApp &rarr;</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
