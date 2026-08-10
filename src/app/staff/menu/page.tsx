"use client";

import React, { useState, useEffect, useMemo } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Utensils,
  BookOpen,
  Search,
  CheckCircle,
  XCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  listCategories,
  listMenuItems,
  toggleMenuItemAvailability,
  updateMenuItem,
} from "@/actions/menu";

interface CategoryData {
  id: string;
  name: string;
  sortOrder: number;
}

interface MenuItemData {
  id: string;
  categoryId: string;
  category?: CategoryData;
  name: string;
  price: number;
  description: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  variants?: any;
}

export default function StaffMenuPage() {
  const [activeTab, setActiveTab] = useState<"menu" | "catalog">("menu");

  // Dynamic Data States
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Load menu data from backend
  const loadMenuData = async () => {
    try {
      setIsLoading(true);
      const [cats, items] = await Promise.all([
        listCategories(),
        listMenuItems(),
      ]);
      setCategories(cats || []);
      setMenuItems(items || []);
    } catch (err: any) {
      console.error("Error loading staff menu data:", err);
      toast.error(err.message || "Failed to load menu data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenuData();
  }, []);

  // Helper to check if an item is special
  const isItemSpecial = (item: MenuItemData) => {
    if (!item.variants) return false;
    if (Array.isArray(item.variants)) {
      return item.variants.some((v: any) => v.name === "special" || v.isSpecial);
    }
    return false;
  };

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === "all" || item.categoryId === selectedCategory;
      
      const special = isItemSpecial(item);
      const matchesAvailability =
        selectedAvailability === "all" ||
        (selectedAvailability === "available" && item.isAvailable) ||
        (selectedAvailability === "unavailable" && !item.isAvailable) ||
        (selectedAvailability === "specials" && special);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [menuItems, searchQuery, selectedCategory, selectedAvailability]);

  // Paginated Menu Items
  const paginatedMenuItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMenuItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMenuItems, currentPage]);

  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage) || 1;

  // Toggle Availability Handler (86 Dish)
  const handleToggleAvailability = async (id: string, currentAvailable: boolean) => {
    // Optimistic Update
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isAvailable: !currentAvailable } : item))
    );

    try {
      await toggleMenuItemAvailability(id, !currentAvailable);
      toast.success(
        !currentAvailable ? "Item marked as Available" : "Item marked as Sold Out (86'd)"
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update item availability");
      await loadMenuData(); // revert
    }
  };

  // Toggle Today's Special Handler
  const handleToggleSpecial = async (item: MenuItemData) => {
    const currentlySpecial = isItemSpecial(item);
    const updatedVariants = !currentlySpecial
      ? [{ name: "special", priceModifier: 0 }]
      : [];

    try {
      await updateMenuItem(item.id, { variants: updatedVariants });
      toast.success(!currentlySpecial ? "Marked as Today's Special" : "Removed from Today's Specials");
      await loadMenuData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update special status");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-widest mb-2">
            STAFF WORKSPACE — MENU CATALOGUE
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Restaurant Menu
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse food & beverage catalog, view pricing, check GST rates, and toggle item availability in real-time.
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="TOTAL CATALOGUE DISHES"
          value={isLoading ? "..." : `${menuItems.length} Active`}
          subtext={`across ${categories.length} active categories`}
        />
        <StatCard
          label="TODAY'S FEATURED SPECIALS"
          value={isLoading ? "..." : `${menuItems.filter((m) => isItemSpecial(m)).length} Promoted`}
          subtext="highlighted for staff order taking"
        />
        <StatCard
          label="AVAILABLE IN KITCHEN"
          value={isLoading ? "..." : `${menuItems.filter((m) => m.isAvailable).length} Ready`}
          subtext={`${menuItems.filter((m) => !m.isAvailable).length} 86'd / Sold out`}
        />
      </div>

      {/* Tab Selectors */}
      <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab("menu");
            setCurrentPage(1);
          }}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0",
            activeTab === "menu"
              ? "bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs"
              : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <Utensils className="w-4 h-4" />
          <span>Menu Items ({menuItems.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("catalog");
            setCurrentPage(1);
          }}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0",
            activeTab === "catalog"
              ? "bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs"
              : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>Full Restaurant Catalog ({categories.length})</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="design-surface p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Loading live menu from database...</span>
        </div>
      )}

      {/* TAB 1: MENU ITEMS */}
      {!isLoading && activeTab === "menu" && (
        <div className="space-y-6">
          {/* Search and Filters Bar */}
          <div className="design-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
              <Input
                placeholder="Search menu items by name or description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 h-9 bg-slate-50 border-slate-200 rounded-xl text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-600/20"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none cursor-pointer h-9"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedAvailability}
                onChange={(e) => {
                  setSelectedAvailability(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none cursor-pointer h-9"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available Only</option>
                <option value="unavailable">Unavailable Only</option>
                <option value="specials">Today&apos;s Specials</option>
              </select>
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedMenuItems.length === 0 ? (
              <div className="col-span-2 design-surface p-12 text-center text-slate-400 text-xs">
                No menu items match your search or filter criteria.
              </div>
            ) : (
              paginatedMenuItems.map((item) => {
                const special = isItemSpecial(item);

                return (
                  <div
                    key={item.id}
                    className="design-surface p-6 flex flex-col justify-between hover:shadow-md transition-all group"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                              {item.category?.name || "General"}
                            </span>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                              item.isVeg 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            )}>
                              {item.isVeg ? "VEG" : "NON-VEG"}
                            </span>
                            {special && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                                <Sparkles className="w-3 h-3" /> Special
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-base text-slate-900 mt-2">
                            {item.name}
                          </h3>
                        </div>

                        {/* Availability Toggle Switch */}
                        <button
                          onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1",
                            item.isAvailable
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
                          )}
                          title="Click to toggle availability in kitchen"
                        >
                          {item.isAvailable ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Available</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Sold Out</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {item.description || "No description provided."}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-lg text-slate-900">
                          ₹{item.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          + 5% GST
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleSpecial(item)}
                          className={cn(
                            "h-8 px-3 text-xs font-semibold rounded-lg border cursor-pointer transition-colors flex items-center gap-1",
                            special
                              ? "bg-amber-50 text-amber-600 border-amber-200"
                              : "text-slate-500 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{special ? "Special Item" : "Mark Special"}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between design-surface px-6 py-4">
              <span className="text-xs text-slate-500">
                Page {currentPage} of {totalPages} ({filteredMenuItems.length} total items)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 text-xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-3 text-xs cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATALOGUE VIEW */}
      {!isLoading && activeTab === "catalog" && (
        <div className="space-y-6">
          <div className="design-surface p-6">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">
                  MASTER RESTAURANT MENU CATALOG
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  Category Pricing & Portion Roster
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Amounts in ₹ (INR)
              </span>
            </div>

            <div className="space-y-8">
              {categories.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No categories found in system database.
                </div>
              ) : (
                categories.map((category) => {
                  const categoryItems = menuItems.filter((i) => i.categoryId === category.id);

                  return (
                    <div key={category.id} className="space-y-3">
                      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80">
                        <span className="font-bold text-sm text-slate-900">{category.name}</span>
                        <span className="text-xs text-slate-500 font-mono font-medium">
                          {categoryItems.length} dishes
                        </span>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold text-slate-400 uppercase">
                            <TableHead className="py-2.5 px-4 h-auto">DISH NAME</TableHead>
                            <TableHead className="py-2.5 px-4 h-auto">DIET</TableHead>
                            <TableHead className="py-2.5 px-4 h-auto text-right">PORTION PRICE (₹)</TableHead>
                            <TableHead className="py-2.5 px-4 h-auto text-right">KITCHEN STATUS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100 text-xs">
                          {categoryItems.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-slate-400 text-xs">
                                No dishes assigned to this category.
                              </TableCell>
                            </TableRow>
                          ) : (
                            categoryItems.map((dish) => (
                              <TableRow key={dish.id} className="hover:bg-slate-50/80 transition-colors">
                                <TableCell className="py-3 px-4 font-semibold text-slate-900">
                                  {dish.name}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold",
                                    dish.isVeg ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
                                  )}>
                                    {dish.isVeg ? "Veg" : "Non-Veg"}
                                  </span>
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                  ₹{dish.price.toFixed(2)}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleToggleAvailability(dish.id, dish.isAvailable)}
                                    className={cn(
                                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block cursor-pointer",
                                      dish.isAvailable
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                        : "bg-rose-50 text-rose-600 border-rose-200"
                                    )}
                                  >
                                    {dish.isAvailable ? "Available" : "Sold Out"}
                                  </button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
