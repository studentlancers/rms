"use client";

import React from "react";
import Link from "next/link";
import { Play, ArrowRight, Star, Sparkles, LayoutDashboard, DollarSign, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 selection:bg-blue-500/20">
      {/* Public Marketing Header */}
      <header className="max-w-7xl mx-auto px-6 md:px-8 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-[#0052ff] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            M
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Mise
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#product" className="hover:text-slate-900 transition-colors">
            Product
          </a>
          <a href="#why-mise" className="hover:text-slate-900 transition-colors">
            Why Mise
          </a>
          <a href="#customers" className="hover:text-slate-900 transition-colors">
            Customers
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/signin"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signin"
            className="px-5 py-2.5 rounded-full bg-slate-950 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all"
          >
            Start free
          </Link>
        </div>
      </header>

      {/* Hero Section matching Screenshot 5 */}
      <section className="max-w-5xl mx-auto px-6 md:px-8 pt-12 md:pt-16 pb-20 text-left relative">
        <div className="design-section-label mb-6">
          THE OPERATING SYSTEM FOR HOSPITALITY
        </div>

        <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.08] max-w-4xl">
          Run a better restaurant,{" "}
          <span className="text-[#0052ff]">every service.</span>
        </h1>

        <p className="text-base md:text-lg text-slate-600 mt-6 max-w-2xl leading-relaxed">
          Mise brings your entire operation into focus. From the first prep list
          to the final close, make sharper decisions and give your team room to
          excel.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-8">
          <Link
            href="/signin"
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all"
          >
            <span>Start your free trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={() => alert("Playing product demo video...")}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-sm font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 text-blue-600 fill-blue-600" />
            <span>See how it works</span>
          </button>
        </div>

        <div className="text-[10px] font-mono font-semibold tracking-widest text-slate-400 uppercase mt-8">
          NO CREDIT CARD REQUIRED · 14-DAY FREE TRIAL
        </div>
      </section>

      {/* Metrics Highlights Band matching Screenshot 1 */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="design-surface p-6">
            <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
              REVENUE CLARITY
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">
              +24.8%
            </div>
            <div className="text-xs font-medium text-emerald-600 mt-1">
              ↑ average uplift
            </div>
          </div>

          <div className="design-surface p-6">
            <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
              HOURS SAVED
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">
              12.5<span className="text-base font-normal text-slate-500">/wk</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              per location
            </div>
          </div>

          <div className="design-surface p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                TONIGHT · LIVE PULSE
              </span>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                • Active service
              </span>
            </div>

            {/* Live Bar Chart */}
            <div className="flex items-end gap-2 h-16 pt-2">
              <div className="flex-1 bg-blue-950 h-8 rounded-md" />
              <div className="flex-1 bg-blue-900 h-10 rounded-md" />
              <div className="flex-1 bg-blue-800 h-9 rounded-md" />
              <div className="flex-1 bg-blue-600 h-13 rounded-md" />
              <div className="flex-1 bg-blue-500 h-14 rounded-md" />
              <div className="flex-1 bg-blue-400 h-15 rounded-md" />
              <div className="flex-1 bg-blue-300 h-16 rounded-md" />
            </div>
          </div>
        </div>
      </section>

      {/* Built For The Whole House Section matching Screenshot 1 */}
      <section id="product" className="max-w-6xl mx-auto px-6 md:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-12">
          <div>
            <div className="design-section-label mb-4">
              BUILT FOR THE WHOLE HOUSE
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              Everything your restaurant needs to{" "}
              <span className="text-[#0052ff]">move as one.</span>
            </h2>
          </div>

          <p className="text-slate-600 text-sm md:text-base leading-relaxed pt-2">
            Great hospitality is a team sport. Mise connects the people,
            numbers, and daily decisions behind the scenes so every guest feels
            the difference.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="design-surface p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Live Service Control</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Monitor table turnovers, live covers, and waitlist queues from one central floor command dashboard.
            </p>
          </div>

          <div className="design-surface p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Cost & Margin Control</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Track item food cost, auto-flag low inventory, and keep net margins predictable across shifts.
            </p>
          </div>

          <div className="design-surface p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Staff Alignment</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Schedule team rosters, track shift statuses, and maintain optimal labour cost targets effortless.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonial Dark Card Banner matching Screenshot 2 */}
      <section id="why-mise" className="max-w-5xl mx-auto px-6 md:px-8 py-12">
        <div className="design-inverted-section design-dot-grid p-8 md:p-10 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center border border-slate-700 mb-4">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-display text-3xl font-semibold text-white leading-tight">
                The calm behind a{" "}
                <span className="text-[#4d7cff]">great service.</span>
              </h3>
              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                Mise gives operators the confidence to stay ahead of the shift,
                from the big picture to the details that matter.
              </p>
            </div>

            <div className="lg:border-l lg:border-slate-800 lg:pl-8 space-y-3">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm font-medium text-slate-200 italic leading-relaxed">
                &ldquo;Mise makes our operation feel less like a puzzle and more
                like a practice.&rdquo;
              </p>
              <div className="text-[10px] font-mono font-semibold tracking-widest text-slate-400 uppercase">
                — OLIVIA CHEN · NORTHSTAR HOSPITALITY
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner matching Screenshot 2 */}
      <section className="max-w-4xl mx-auto px-6 md:px-8 py-24 text-center">
        <div className="text-[10px] font-mono font-semibold tracking-widest text-slate-400 uppercase mb-3">
          READY WHEN YOU ARE
        </div>
        <h2 className="font-display text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
          Make every service your best one yet.
        </h2>
        <div className="mt-8">
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-sm font-semibold shadow-xl shadow-blue-500/25 transition-all"
          >
            <span>Get started with Mise</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8 text-center text-xs text-slate-400 font-mono">
        © 2026 Mise Hospitality Operating System. All rights reserved.
      </footer>
    </div>
  );
}
