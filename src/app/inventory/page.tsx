"use client";

import React, { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { Plus, Search, SlidersHorizontal, Download, Package } from "lucide-react";

export default function InventoryPage() {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const inventoryItems = [
    {
      name: "Atlantic salmon",
      category: "Protein",
      onHand: "3.2 kg",
      unitCost: "$24.00 / kg",
      percentage: 18,
      status: "Low",
    },
    {
      name: "Burrata di Puglia",
      category: "Dairy",
      onHand: "8 portions",
      unitCost: "$4.80 / pc",
      percentage: 32,
      status: "Low",
    },
    {
      name: "Domaine des Hâtes",
      category: "Beverage",
      onHand: "14 bottles",
      unitCost: "$28.00 / bt",
      percentage: 69,
      status: "Healthy",
    },
    {
      name: "Heirloom tomatoes",
      category: "Produce",
      onHand: "12.5 kg",
      unitCost: "$6.20 / kg",
      percentage: 76,
      status: "Healthy",
    },
    {
      name: "Sourdough flour",
      category: "Dry goods",
      onHand: "24 kg",
      unitCost: "$2.40 / kg",
      percentage: 84,
      status: "Healthy",
    },
  ];

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">COST CONTROL</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track what is on hand, what is moving, and what needs action.
          </p>
        </div>

        <button
          onClick={() => setIsAddItemOpen(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add item</span>
        </button>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="INVENTORY VALUE"
          value="$28,460"
          subtext="↗ 4.2% this month"
        />
        <StatCard
          label="ITEMS TO REORDER"
          value="8"
          subtext="↘ 3 urgent"
        />
        <StatCard
          label="FOOD COST THIS MONTH"
          value="28.4%"
          subtext="↗ 1.8% under target"
        />
      </div>

      {/* Inventory Main Table Card */}
      <div className="design-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search inventory"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Protein">Protein</option>
              <option value="Dairy">Dairy</option>
              <option value="Beverage">Beverage</option>
              <option value="Produce">Produce</option>
              <option value="Dry goods">Dry goods</option>
            </select>

            <button
              onClick={() => alert("Exporting inventory CSV...")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                <th className="py-3 px-4">ITEM</th>
                <th className="py-3 px-4">ON HAND</th>
                <th className="py-3 px-4">UNIT COST</th>
                <th className="py-3 px-4 w-48">STOCK LEVEL</th>
                <th className="py-3 px-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/60">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.category}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4 font-semibold text-slate-800">
                    {item.onHand}
                  </td>

                  <td className="py-4 px-4 text-slate-600 font-mono">
                    {item.unitCost}
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.percentage <= 35 ? "bg-orange-500" : "bg-blue-600"
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 w-8">
                        {item.percentage}%
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Inventory Item */}
      <Modal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        title="Add Inventory Item"
        subtitle="Register new stock item and specify reorder threshold."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item Name
            </label>
            <input
              type="text"
              placeholder="e.g. Wagyu Ribeye"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20">
                <option value="Protein">Protein</option>
                <option value="Dairy">Dairy</option>
                <option value="Beverage">Beverage</option>
                <option value="Produce">Produce</option>
                <option value="Dry goods">Dry goods</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Cost
              </label>
              <input
                type="text"
                placeholder="e.g. $42.00 / kg"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              onClick={() => setIsAddItemOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert("New item added to inventory!");
                setIsAddItemOpen(false);
              }}
              className="px-5 py-2 rounded-xl bg-[#0052ff] text-white text-xs font-semibold shadow-sm"
            >
              Save Item
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
