"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Plus,
  Edit2,
  Trash2,
  Utensils,
  BookOpen,
  Search,
  CheckCircle,
  XCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FolderPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  listCategories,
  listMenuItems,
  createCategory,
  updateCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItem,
  toggleMenuItemAvailability,
  deleteMenuItem,
} from "@/actions/menu";
import { listInventoryItems } from "@/actions/inventory";

interface CategoryData {
  id: string;
  name: string;
  sortOrder: number;
  menuItems?: any[];
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
  recipe?: any;
  effectiveIsAvailable?: boolean;
  stockStatus?: "Available" | "Low Stock" | "Out of Stock";
  maxPortionsAvailable?: number;
}

export default function MenuModulePage() {
  const [activeTab, setActiveTab] = useState<"menu" | "catalog">("menu");

  // Dynamic Data States
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<
    Array<{ inventoryItemId: string; quantityRequired: number; unit: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Add/Edit Menu Item Modal State
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItemData | null>(null);

  // Form States for Menu Item
  const [menuName, setMenuName] = useState("");
  const [menuCategory, setMenuCategory] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [menuHalfPrice, setMenuHalfPrice] = useState("");
  const [menuGst, setMenuGst] = useState("5");
  const [menuDesc, setMenuDesc] = useState("");
  const [menuIsVeg, setMenuIsVeg] = useState(false);
  const [menuAvailable, setMenuAvailable] = useState(true);
  const [menuIsSpecial, setMenuIsSpecial] = useState(false);

  // Category Modal State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySort, setNewCategorySort] = useState("0");

  // Fetch data from backend
  const loadMenuData = async () => {
    try {
      setIsLoading(true);
      const [cats, items, invItems] = await Promise.all([
        listCategories(),
        listMenuItems(),
        listInventoryItems(),
      ]);
      setCategories(cats || []);
      setMenuItems(items || []);
      setInventoryItems(invItems || []);
      if (cats && cats.length > 0 && !menuCategory) {
        setMenuCategory(cats[0].id);
      }
    } catch (err: any) {
      console.error("Error loading menu data:", err);
      toast.error(err.message || "Failed to load menu data from server");
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
      
      const isSpecial = isItemSpecial(item);
      const matchesAvailability =
        selectedAvailability === "all" ||
        (selectedAvailability === "available" && item.isAvailable) ||
        (selectedAvailability === "unavailable" && !item.isAvailable) ||
        (selectedAvailability === "specials" && isSpecial);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [menuItems, searchQuery, selectedCategory, selectedAvailability]);

  // Paginated Menu Items
  const paginatedMenuItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMenuItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMenuItems, currentPage]);

  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage) || 1;

  // Toggle Availability Handler
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
      toast.error(err.message || "Failed to update availability");
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

  // Recipe Helper Handlers
  const handleAddRecipeRow = () => {
    if (!inventoryItems || inventoryItems.length === 0) {
      toast.error("No inventory items found. Please register stock items in the Inventory section first.");
      return;
    }
    const firstItem = inventoryItems[0];
    setRecipeIngredients((prev) => [
      ...prev,
      { inventoryItemId: firstItem.id, quantityRequired: 1, unit: firstItem.unit || "g" },
    ]);
  };

  const handleUpdateRecipeRow = (index: number, field: string, value: any) => {
    setRecipeIngredients((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "inventoryItemId") {
        const selectedInv = inventoryItems.find((inv) => inv.id === value);
        if (selectedInv && selectedInv.unit) {
          updated[index].unit = selectedInv.unit;
        }
      }
      return updated;
    });
  };

  const handleRemoveRecipeRow = (index: number) => {
    setRecipeIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  // Open Edit Menu Item Modal
  const openEditMenu = (item: MenuItemData) => {
    setEditingMenuItem(item);
    setMenuName(item.name);
    setMenuCategory(item.categoryId);
    setMenuPrice(item.price.toString());
    
    // Extract Half price if present in variants
    const halfVar = Array.isArray(item.variants)
      ? item.variants.find((v: any) => v.name?.toLowerCase() === "half")
      : null;
    if (halfVar) {
      const halfActualPrice = item.price + (halfVar.priceModifier || 0);
      setMenuHalfPrice(halfActualPrice > 0 ? halfActualPrice.toString() : "");
    } else {
      setMenuHalfPrice("");
    }

    setMenuDesc(item.description || "");
    setMenuIsVeg(item.isVeg || false);
    setMenuAvailable(item.isAvailable);
    setMenuIsSpecial(isItemSpecial(item));

    if (Array.isArray(item.recipe) && item.recipe.length > 0) {
      setRecipeIngredients(
        item.recipe.map((r: any) => ({
          inventoryItemId: r.inventoryItemId,
          quantityRequired: Number(r.quantityRequired) || 1,
          unit: r.unit || "g",
        }))
      );
    } else {
      setRecipeIngredients([]);
    }

    setIsAddMenuOpen(true);
  };

  // Open Add Menu Item Modal
  const openAddMenu = () => {
    setEditingMenuItem(null);
    setMenuName("");
    if (categories.length > 0) {
      setMenuCategory(categories[0].id);
    }
    setMenuPrice("");
    setMenuHalfPrice("");
    setMenuDesc("");
    setMenuIsVeg(false);
    setMenuAvailable(true);
    setMenuIsSpecial(false);
    setRecipeIngredients([]);
    setIsAddMenuOpen(true);
  };

  // Save Menu Item Handler (Create & Update)
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = menuName.trim();
    if (!cleanName) {
      toast.error("Dish name is required");
      return;
    }
    if (!menuCategory) {
      toast.error("Please select or create a category first");
      return;
    }
    const numPrice = parseFloat(menuPrice);
    if (isNaN(numPrice) || numPrice <= 0 || numPrice > 100000) {
      toast.error("Please enter a valid price between ₹0.01 and ₹100,000");
      return;
    }

    let parsedHalfPrice: number | null = null;
    if (menuHalfPrice.trim()) {
      const numHalf = parseFloat(menuHalfPrice);
      if (isNaN(numHalf) || numHalf <= 0 || numHalf > 100000) {
        toast.error("Please enter a valid half price between ₹0.01 and ₹100,000");
        return;
      }
      parsedHalfPrice = numHalf;
    }

    // Validate recipe ingredients
    for (const ing of recipeIngredients) {
      if (!ing.inventoryItemId) {
        toast.error("Please select an inventory item for all recipe rows");
        return;
      }
      if (isNaN(ing.quantityRequired) || ing.quantityRequired <= 0) {
        toast.error("Required ingredient quantity must be greater than 0");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const variantsList: Array<{ name: string; priceModifier: number }> = [];
      if (parsedHalfPrice !== null) {
        variantsList.push({
          name: "Half",
          priceModifier: parsedHalfPrice - numPrice,
        });
      }
      if (menuIsSpecial) {
        variantsList.push({ name: "special", priceModifier: 0 });
      }

      if (editingMenuItem) {
        await updateMenuItem(editingMenuItem.id, {
          name: menuName.trim(),
          categoryId: menuCategory,
          price: parseFloat(menuPrice),
          description: menuDesc.trim() || undefined,
          isVeg: menuIsVeg,
          isAvailable: menuAvailable,
          variants: variantsList,
          recipe: recipeIngredients,
        });
        toast.success("Menu item updated successfully");
      } else {
        const formData = new FormData();
        formData.append("name", menuName.trim());
        formData.append("categoryId", menuCategory);
        formData.append("price", menuPrice);
        formData.append("description", menuDesc.trim());
        formData.append("isVeg", String(menuIsVeg));
        formData.append("isAvailable", String(menuAvailable));
        if (variantsList.length > 0) {
          formData.append("variants", JSON.stringify(variantsList));
        }
        if (recipeIngredients.length > 0) {
          formData.append("recipe", JSON.stringify(recipeIngredients));
        }

        await createMenuItem(formData);
        toast.success("New menu item created successfully");
      }

      await loadMenuData();
      setIsAddMenuOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Menu Item Handler
  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;

    try {
      await deleteMenuItem(id);
      toast.success("Menu item deleted");
      await loadMenuData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete menu item");
    }
  };

  // Save Category Handler (Create & Update)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: newCategoryName.trim(),
          sortOrder: parseInt(newCategorySort, 10) || 0,
        });
        toast.success("Category updated successfully");
      } else {
        const formData = new FormData();
        formData.append("name", newCategoryName.trim());
        formData.append("sortOrder", newCategorySort);
        await createCategory(formData);
        toast.success("Category created successfully");
      }

      await loadMenuData();
      setIsAddCategoryOpen(false);
      setEditingCategory(null);
      setNewCategoryName("");
      setNewCategorySort("0");
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Category Handler
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Deleting this category will also delete all items inside it. Proceed?")) return;

    try {
      await deleteCategory(categoryId);
      toast.success("Category deleted");
      await loadMenuData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">RESTAURANT CATALOGUE & PRICING</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Menu Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage food & beverage items, categories, pricing, availability, and Today&apos;s Specials.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <Button
            variant="outline"
            onClick={() => {
              setEditingCategory(null);
              setNewCategoryName("");
              setNewCategorySort(String(categories.length));
              setIsAddCategoryOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold border-slate-200 hover:bg-slate-50 cursor-pointer h-auto"
          >
            <FolderPlus className="w-4 h-4 text-blue-600" />
            <span>Add Category</span>
          </Button>

          {activeTab === "menu" && (
            <Button
              onClick={openAddMenu}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer border-none h-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Menu Item</span>
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="TOTAL MENU ITEMS"
          value={isLoading ? "..." : `${menuItems.length} Dishes`}
          subtext={`across ${categories.length} active categories`}
        />
        <StatCard
          label="TODAY'S SPECIALS"
          value={isLoading ? "..." : `${menuItems.filter((m) => isItemSpecial(m)).length} Featured`}
          subtext="promoted on staff & customer Kiosk"
        />
        <StatCard
          label="AVAILABLE ITEMS"
          value={isLoading ? "..." : `${menuItems.filter((m) => m.isAvailable).length} Active`}
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
          <span>Categories & Roster ({categories.length})</span>
        </button>
      </div>

      {/* Loading Indicator */}
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
                {menuItems.length === 0 ? (
                  <div className="space-y-3">
                    <Utensils className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700 text-sm">No Menu Items Found</p>
                    <p>Your restaurant menu is currently empty. Click &quot;Add Menu Item&quot; to create your first dish.</p>
                    <Button onClick={openAddMenu} className="mt-2 text-xs bg-blue-600 text-white rounded-xl">
                      <Plus className="w-4 h-4 mr-1" /> Add First Item
                    </Button>
                  </div>
                ) : (
                  "No menu items match your search or filter criteria."
                )}
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
                          title="Click to toggle availability"
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
                            "h-8 px-2.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors",
                            special
                              ? "bg-amber-50 text-amber-600 border-amber-200"
                              : "text-slate-500 border-slate-200 hover:bg-slate-100"
                          )}
                          title="Toggle Today's Special"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditMenu(item)}
                          className="h-8 px-3 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMenuItem(item.id)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg cursor-pointer p-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* TAB 2: CATALOGUE & CATEGORY ROSTER */}
      {!isLoading && activeTab === "catalog" && (
        <div className="space-y-6">
          <div className="design-surface p-6">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">
                  MASTER RESTAURANT CATEGORY ROSTER
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  Categories & Dish Allocation
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCategory(null);
                  setNewCategoryName("");
                  setNewCategorySort(String(categories.length));
                  setIsAddCategoryOpen(true);
                }}
                className="text-xs rounded-xl"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Category
              </Button>
            </div>

            <div className="space-y-8">
              {categories.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No categories created yet. Click &quot;Add Category&quot; to define your menu sections.
                </div>
              ) : (
                categories.map((category) => {
                  const categoryItems = menuItems.filter((i) => i.categoryId === category.id);

                  return (
                    <div key={category.id} className="space-y-3">
                      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-slate-900">{category.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded">
                            Sort: {category.sortOrder}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-mono font-medium mr-2">
                            {categoryItems.length} dishes
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(category);
                              setNewCategoryName(category.name);
                              setNewCategorySort(String(category.sortOrder));
                              setIsAddCategoryOpen(true);
                            }}
                            className="h-7 px-2 text-xs text-slate-600 hover:bg-slate-200 rounded"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold text-slate-400 uppercase">
                            <TableHead className="py-2.5 px-4 h-auto">DISH NAME</TableHead>
                            <TableHead className="py-2.5 px-4 h-auto">TYPE</TableHead>
                            <TableHead className="py-2.5 px-4 h-auto text-right">PRICE (₹)</TableHead>
                            <TableHead className="py-2.5 px-4 h-auto text-center">STATUS</TableHead>
                            <TableHead className="py-2.5 px-4 h-auto text-right">ACTIONS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100 text-xs">
                          {categoryItems.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-4 text-slate-400 text-xs">
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
                                <TableCell className="py-3 px-4 text-center">
                                  <span
                                    className={cn(
                                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                                      dish.isAvailable
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                        : "bg-rose-50 text-rose-600 border-rose-200"
                                    )}
                                  >
                                    {dish.isAvailable ? "Available" : "Sold Out"}
                                  </span>
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditMenu(dish)}
                                    className="h-7 px-2.5 text-xs text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-lg cursor-pointer"
                                  >
                                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                                  </Button>
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

      {/* Modal: Add/Edit Menu Item */}
      <Modal
        isOpen={isAddMenuOpen}
        onClose={() => setIsAddMenuOpen(false)}
        title={editingMenuItem ? "Edit Menu Item" : "Add New Menu Item"}
        subtitle="Specify dish name, category, price, diet type, and description."
      >
        <form onSubmit={handleSaveMenuItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dish Name *
            </label>
            <Input
              type="text"
              required
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder="e.g. Butter Chicken"
              className="w-full px-3 py-2 h-10 text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              {categories.length === 0 ? (
                <div className="text-xs text-rose-500 py-2">
                  No categories. Please add a category first.
                </div>
              ) : (
                <select
                  value={menuCategory}
                  onChange={(e) => setMenuCategory(e.target.value)}
                  className="w-full px-3 py-2 h-10 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Price (₹) *
              </label>
              <Input
                type="number"
                step="0.01"
                required
                value={menuPrice}
                onChange={(e) => setMenuPrice(e.target.value)}
                placeholder="290.00"
                className="w-full px-3 py-2 h-10 text-xs rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Half Price (₹) <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                type="number"
                step="0.01"
                value={menuHalfPrice}
                onChange={(e) => setMenuHalfPrice(e.target.value)}
                placeholder="160.00"
                className="w-full px-3 py-2 h-10 text-xs rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={menuDesc}
              onChange={(e) => setMenuDesc(e.target.value)}
              placeholder="Ingredients, preparation details, allergens..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          {/* Inventory Requirements (Recipe / BOM) Section */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-900">
                  Inventory Requirements (Recipe)
                </label>
                <p className="text-[11px] text-slate-500">
                  Map raw material dependencies to validate stock & auto-deduct on completion.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRecipeRow}
                className="text-xs h-8 px-3 rounded-lg border-slate-200 text-blue-600 hover:bg-blue-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Inventory Item</span>
              </Button>
            </div>

            {recipeIngredients.length === 0 ? (
              <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 text-center">
                No inventory dependencies linked to this dish.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {recipeIngredients.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/70"
                  >
                    <select
                      value={row.inventoryItemId}
                      onChange={(e) =>
                        handleUpdateRecipeRow(idx, "inventoryItemId", e.target.value)
                      }
                      className="flex-1 px-2.5 py-1.5 h-9 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                    >
                      {inventoryItems.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} ({inv.quantity} {inv.unit} on hand)
                        </option>
                      ))}
                    </select>

                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={row.quantityRequired}
                      onChange={(e) =>
                        handleUpdateRecipeRow(
                          idx,
                          "quantityRequired",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Qty"
                      className="w-20 px-2 py-1.5 h-9 text-xs rounded-lg font-mono"
                    />

                    <select
                      value={row.unit}
                      onChange={(e) =>
                        handleUpdateRecipeRow(idx, "unit", e.target.value)
                      }
                      className="w-24 px-2 py-1.5 h-9 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="l">l</option>
                      <option value="ml">ml</option>
                      <option value="pcs">pcs</option>
                      <option value="portions">portions</option>
                      <option value="bottles">bottles</option>
                      <option value="units">units</option>
                    </select>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRecipeRow(idx)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 pt-2 flex-wrap">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={menuIsVeg}
                onChange={(e) => setMenuIsVeg(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600"
              />
              <span className="text-emerald-700">Vegetarian Dish (Veg)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={menuAvailable}
                onChange={(e) => setMenuAvailable(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Available for order</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-amber-600 cursor-pointer">
              <input
                type="checkbox"
                checked={menuIsSpecial}
                onChange={(e) => setMenuIsSpecial(e.target.checked)}
                className="rounded border-slate-300 text-amber-600"
              />
              <span>Mark as Today&apos;s Special</span>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddMenuOpen(false)}
              className="px-4 py-2 h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 h-9 text-xs bg-[#0052ff] hover:bg-[#0046dc] text-white font-semibold rounded-xl border-none cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </span>
              ) : (
                "Save Menu Item"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add/Edit Category */}
      <Modal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        title={editingCategory ? "Edit Category" : "Add New Category"}
        subtitle="Organize dishes into dining sections (e.g. Starters, Main Course, Beverages)."
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Name *
            </label>
            <Input
              type="text"
              required
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Starters, Desserts, Italian"
              className="w-full px-3 py-2 h-10 text-xs rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Display Sort Order
            </label>
            <Input
              type="number"
              value={newCategorySort}
              onChange={(e) => setNewCategorySort(e.target.value)}
              className="w-full px-3 py-2 h-10 text-xs rounded-xl font-mono"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddCategoryOpen(false)}
              className="px-4 py-2 h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 h-9 text-xs bg-[#0052ff] hover:bg-[#0046dc] text-white font-semibold rounded-xl border-none cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </span>
              ) : (
                "Save Category"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
