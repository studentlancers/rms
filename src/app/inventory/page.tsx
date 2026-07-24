"use client";

import React, { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { Plus, Search, Download, Package, FolderPlus } from "lucide-react";

export default function InventoryPage() {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  // Dynamic Categories state
  const [categories, setCategories] = useState<string[]>([
    "Protein",
    "Dairy",
    "Beverage",
    "Produce",
    "Dry goods",
  ]);

  // Form states
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Protein");
  const [newItemUnitCost, setNewItemUnitCost] = useState("");
  const [newItemOnHand, setNewItemOnHand] = useState("10 kg");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");

  const [inventoryItems, setInventoryItems] = useState([
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
  ]);

  const handleAddCategory = () => {
    if (!customCategoryName.trim()) return;
    const formattedCat = customCategoryName.trim();
    if (!categories.includes(formattedCat)) {
      setCategories((prev) => [...prev, formattedCat]);
    }
    setNewItemCategory(formattedCat);
    setCustomCategoryName("");
    setIsCreatingCategory(false);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem = {
      name: newItemName,
      category: newItemCategory,
      onHand: newItemOnHand || "10 units",
      unitCost: newItemUnitCost || "$10.00 / unit",
      percentage: 80,
      status: "Healthy",
    };

    setInventoryItems((prev) => [newItem, ...prev]);
    setIsAddItemOpen(false);
    setNewItemName("");
    setNewItemUnitCost("");
  };

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === "All" || item.category === selectedCategoryFilter;
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
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start md:self-auto cursor-pointer"
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
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              onClick={() => alert("Exporting inventory CSV...")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
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

      {/* Modal: Add New Inventory Item with Dynamic Category Creation */}
      <Modal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        title="Add Inventory Item"
        subtitle="Register new stock item and select or create a category."
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wagyu Ribeye"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <FolderPlus className="w-3 h-3" />
                  <span>+ New</span>
                </button>
              </div>

              {!isCreatingCategory ? (
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="New category..."
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-blue-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg shrink-0"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Cost
              </label>
              <input
                type="text"
                placeholder="e.g. $42.00 / kg"
                value={newItemUnitCost}
                onChange={(e) => setNewItemUnitCost(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity / Initial On Hand
            </label>
            <input
              type="text"
              placeholder="e.g. 15.5 kg or 20 bottles"
              value={newItemOnHand}
              onChange={(e) => setNewItemOnHand(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddItemOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0052ff] text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              Save Item
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
