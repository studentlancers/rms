"use client";

import React, { useState } from "react";
import { Store, ShieldCheck, Bell, CreditCard, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Restaurant profile");

  // Form states matching Screenshot 3
  const [restaurantName, setRestaurantName] = useState("The Langham");
  const [location, setLocation] = useState("Main dining room");
  const [address, setAddress] = useState("1 Portland Place, London W1B 1JA");

  const tabs = [
    { name: "Restaurant profile", icon: Store },
    { name: "Team permissions", icon: ShieldCheck },
    { name: "Notifications", icon: Bell },
    { name: "Billing & plan", icon: CreditCard },
    { name: "Integrations", icon: Layers },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Changes saved successfully!");
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="text-[10px] font-mono font-semibold tracking-widest text-blue-600 uppercase mb-2">
          WORKSPACE ADMIN
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your restaurant profile, preferences, and integrations.
        </p>
      </div>

      {/* Settings Grid with Left Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Left Sub-Navigation */}
        <div className="space-y-1.5 font-sans">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={cn(
                  "w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 flex items-center justify-between",
                  isActive
                    ? "bg-blue-50/80 text-blue-600 font-semibold border border-blue-200/60 shadow-2xs"
                    : tab.name === "Team permissions"
                    ? "border border-slate-900 text-slate-800 hover:bg-slate-50"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Form Card */}
        <div className="md:col-span-3 design-surface p-8">
          {activeTab === "Restaurant profile" ? (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Profile Card Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Restaurant profile
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Information used across your Mise workspace.
                  </p>
                </div>
              </div>

              {/* Form Fields matching Screenshot 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-2">
                    Restaurant name
                  </label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all bg-white"
                />
              </div>

              {/* Action Button matching Screenshot 3 */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Save changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{activeTab}</h3>
                  <p className="text-xs text-slate-400">Manage permissions and configuration for {activeTab.toLowerCase()}.</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600">
                Configurations for <strong>{activeTab}</strong> are active and synced across your workspace.
              </div>
              <button
                onClick={() => alert(`Saved settings for ${activeTab}`)}
                className="px-6 py-2.5 rounded-full bg-[#0052ff] text-white text-xs font-semibold"
              >
                Save changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
