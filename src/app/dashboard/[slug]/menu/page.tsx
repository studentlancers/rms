"use client";

import React, { useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
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
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  gstPercent: number;
  description: string;
  available: boolean;
  isTodaySpecial?: boolean;
}

interface CatalogItem {
  name: string;
  halfPrice: number | null;
  fullPrice: number;
  available?: boolean;
}

interface CatalogSection {
  category: string;
  items: CatalogItem[];
}

export default function MenuModulePage() {
  const [activeTab, setActiveTab] = useState<"menu" | "catalog">("menu");

  // Initial Catalog Data
  const initialCatalogSections: CatalogSection[] = [
    {
      category: "Veg Starters",
      items: [
        { name: "Paneer Tikka", halfPrice: 180, fullPrice: 320, available: true },
        { name: "Hara Bhara Kebab", halfPrice: 150, fullPrice: 270, available: true },
        { name: "Crispy Corn Chili Pepper", halfPrice: 160, fullPrice: 280, available: true },
        { name: "Mushroom Multani", halfPrice: 190, fullPrice: 340, available: true },
      ],
    },
    {
      category: "Non-Veg Starters",
      items: [
        { name: "Chicken Tikka", halfPrice: 220, fullPrice: 390, available: true },
        { name: "Tandoori Chicken", halfPrice: 240, fullPrice: 440, available: true },
        { name: "Fish Amritsari", halfPrice: 280, fullPrice: 490, available: true },
        { name: "Mutton Seekh Kebab", halfPrice: 310, fullPrice: 550, available: true },
      ],
    },
    {
      category: "Soups",
      items: [
        { name: "Tomato Basil Soup", halfPrice: 90, fullPrice: 150, available: true },
        { name: "Sweet Corn Chicken Soup", halfPrice: 110, fullPrice: 180, available: true },
        { name: "Hot & Sour Veg Soup", halfPrice: 100, fullPrice: 160, available: true },
        { name: "Manchow Soup (Veg / Non-Veg)", halfPrice: 110, fullPrice: 190, available: true },
      ],
    },
    {
      category: "Main Course",
      items: [
        { name: "Dal Makhani", halfPrice: 170, fullPrice: 290, available: true },
        { name: "Paneer Butter Masala", halfPrice: 200, fullPrice: 360, available: true },
        { name: "Butter Chicken", halfPrice: 250, fullPrice: 450, available: true },
        { name: "Mutton Rogan Josh", halfPrice: 310, fullPrice: 560, available: true },
        { name: "Kadhai Paneer", halfPrice: 190, fullPrice: 340, available: true },
      ],
    },
    {
      category: "Biryani",
      items: [
        { name: "Veg Dum Biryani", halfPrice: 180, fullPrice: 310, available: true },
        { name: "Hyderabadi Chicken Biryani", halfPrice: 230, fullPrice: 410, available: true },
        { name: "Special Mutton Biryani", halfPrice: 290, fullPrice: 520, available: true },
        { name: "Egg Biryani", halfPrice: 160, fullPrice: 280, available: true },
      ],
    },
    {
      category: "Chinese",
      items: [
        { name: "Veg Hakka Noodles", halfPrice: 140, fullPrice: 240, available: true },
        { name: "Chili Chicken Dry / Gravy", halfPrice: 210, fullPrice: 370, available: true },
        { name: "Veg Fried Rice", halfPrice: 130, fullPrice: 230, available: true },
        { name: "Chicken Schezwan Fried Rice", halfPrice: 170, fullPrice: 300, available: true },
      ],
    },
    {
      category: "Desserts & Beverages",
      items: [
        { name: "Gulab Jamun (2 pcs)", halfPrice: null, fullPrice: 120, available: true },
        { name: "Rasmalai (2 pcs)", halfPrice: null, fullPrice: 150, available: true },
        { name: "Fresh Lime Soda", halfPrice: null, fullPrice: 110, available: true },
        { name: "Cold Coffee with Ice Cream", halfPrice: null, fullPrice: 160, available: true },
      ],
    },
  ];

  const [catalogSections, setCatalogSections] = useState<CatalogSection[]>(initialCatalogSections);

  // Menu items state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: "M-1",
      name: "Pan-Seared Atlantic Salmon",
      category: "Mains",
      price: 1250.0,
      gstPercent: 5,
      description: "Crispy skin salmon with crushed heirloom potatoes & dill emulsion.",
      available: true,
      isTodaySpecial: true,
    },
    {
      id: "M-2",
      name: "Burrata di Puglia Salad",
      category: "Starters",
      price: 680.0,
      gstPercent: 5,
      description: "Fresh Puglia burrata, vine tomatoes, basil oil & balsamic reduction.",
      available: true,
      isTodaySpecial: false,
    },
    {
      id: "M-3",
      name: "Wagyu Ribeye Steak 300g",
      category: "Mains",
      price: 2450.0,
      gstPercent: 5,
      description: "Charcoal grilled MB5+ ribeye with red wine jus & truffle fries.",
      available: true,
      isTodaySpecial: true,
    },
    {
      id: "M-4",
      name: "Tiramisu Tradizionale",
      category: "Desserts",
      price: 450.0,
      gstPercent: 5,
      description: "Espresso soaked savoiardi, mascarpone cream & cocoa powder.",
      available: false,
      isTodaySpecial: false,
    },
    {
      id: "M-5",
      name: "Tandoori Whole Pomfret",
      category: "Starters",
      price: 950.0,
      gstPercent: 5,
      description: "Fresh ocean pomfret marinated in coastal spices & chargrilled.",
      available: true,
      isTodaySpecial: true,
    },
    {
      id: "M-6",
      name: "Truffle Mushroom Risotto",
      category: "Mains",
      price: 820.0,
      gstPercent: 5,
      description: "Arborio rice, wild porcini mushrooms, black truffle butter & parmesan.",
      available: true,
      isTodaySpecial: false,
    },
  ]);

  // Search, Category, and Availability Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Add/Edit Menu Item Modal State
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

  // Form states for Menu Item
  const [menuName, setMenuName] = useState("");
  const [menuCategory, setMenuCategory] = useState("Mains");
  const [menuPrice, setMenuPrice] = useState("450.00");
  const [menuGst, setMenuGst] = useState("5");
  const [menuDesc, setMenuDesc] = useState("");
  const [menuAvailable, setMenuAvailable] = useState(true);
  const [menuIsSpecial, setMenuIsSpecial] = useState(false);

  // Edit Catalog Item Modal State
  const [isEditCatalogOpen, setIsEditCatalogOpen] = useState(false);
  const [catalogOriginalCategory, setCatalogOriginalCategory] = useState("");
  const [catalogOriginalName, setCatalogOriginalName] = useState("");
  const [catalogDishName, setCatalogDishName] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("Veg Starters");
  const [catalogHalfPrice, setCatalogHalfPrice] = useState("");
  const [catalogFullPrice, setCatalogFullPrice] = useState("");
  const [catalogAvailable, setCatalogAvailable] = useState(true);

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesAvailability =
        selectedAvailability === "all" ||
        (selectedAvailability === "available" && item.available) ||
        (selectedAvailability === "unavailable" && !item.available) ||
        (selectedAvailability === "specials" && item.isTodaySpecial);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [menuItems, searchQuery, selectedCategory, selectedAvailability]);

  // Paginated Menu Items
  const paginatedMenuItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMenuItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMenuItems, currentPage]);

  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage) || 1;

  // Toggle availability handler
  const handleToggleAvailability = (id: string) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, available: !item.available } : item))
    );
  };

  // Toggle Today's Special handler
  const handleToggleSpecial = (id: string) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isTodaySpecial: !item.isTodaySpecial } : item
      )
    );
  };

  // Open Edit Menu Modal
  const openEditMenu = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuName(item.name);
    setMenuCategory(item.category);
    setMenuPrice(item.price.toString());
    setMenuGst(item.gstPercent.toString());
    setMenuDesc(item.description);
    setMenuAvailable(item.available);
    setMenuIsSpecial(item.isTodaySpecial || false);
    setIsAddMenuOpen(true);
  };

  const handleSaveMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuName.trim()) return;

    if (editingMenuItem) {
      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === editingMenuItem.id
            ? {
                ...item,
                name: menuName,
                category: menuCategory,
                price: parseFloat(menuPrice) || 0,
                gstPercent: parseFloat(menuGst) || 0,
                description: menuDesc,
                available: menuAvailable,
                isTodaySpecial: menuIsSpecial,
              }
            : item
        )
      );
    } else {
      const newItem: MenuItem = {
        id: `M-${Date.now().toString().slice(-3)}`,
        name: menuName,
        category: menuCategory,
        price: parseFloat(menuPrice) || 0,
        gstPercent: parseFloat(menuGst) || 0,
        description: menuDesc,
        available: menuAvailable,
        isTodaySpecial: menuIsSpecial,
      };
      setMenuItems((prev) => [...prev, newItem]);
    }

    setIsAddMenuOpen(false);
    setEditingMenuItem(null);
    setMenuName("");
    setMenuDesc("");
  };

  const handleDeleteMenuItem = (id: string) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Catalog item edit handlers
  const openEditCatalog = (dish: CatalogItem, sectionCategory: string) => {
    setCatalogOriginalCategory(sectionCategory);
    setCatalogOriginalName(dish.name);
    setCatalogDishName(dish.name);
    setCatalogCategory(sectionCategory);
    setCatalogHalfPrice(dish.halfPrice !== null ? dish.halfPrice.toString() : "");
    setCatalogFullPrice(dish.fullPrice.toString());
    setCatalogAvailable(dish.available ?? true);
    setIsEditCatalogOpen(true);
  };

  const handleSaveCatalogDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogDishName.trim()) return;

    const updatedDish: CatalogItem = {
      name: catalogDishName.trim(),
      halfPrice: catalogHalfPrice.trim() !== "" ? parseFloat(catalogHalfPrice) : null,
      fullPrice: parseFloat(catalogFullPrice) || 0,
      available: catalogAvailable,
    };

    setCatalogSections((prevSections) => {
      let newSections = prevSections.map((sec) => ({
        ...sec,
        items: [...sec.items],
      }));

      newSections = newSections.map((sec) => {
        if (sec.category === catalogOriginalCategory) {
          return {
            ...sec,
            items: sec.items.filter((i) => i.name !== catalogOriginalName),
          };
        }
        return sec;
      });

      let categoryExists = false;
      newSections = newSections.map((sec) => {
        if (sec.category === catalogCategory) {
          categoryExists = true;
          return {
            ...sec,
            items: [...sec.items, updatedDish],
          };
        }
        return sec;
      });

      if (!categoryExists) {
        newSections.push({
          category: catalogCategory,
          items: [updatedDish],
        });
      }

      return newSections;
    });

    setIsEditCatalogOpen(false);
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
            Manage food & beverage items, categories, pricing, GST rates, availability, and Today's Specials.
          </p>
        </div>

        {activeTab === "menu" && (
          <Button
            onClick={() => {
              setEditingMenuItem(null);
              setMenuName("");
              setMenuDesc("");
              setIsAddMenuOpen(true);
            }}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start md:self-auto cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </Button>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="TOTAL MENU ITEMS"
          value={`${menuItems.length} Dishes`}
          subtext="across all dining categories"
        />
        <StatCard
          label="TODAY'S SPECIALS"
          value={`${menuItems.filter((m) => m.isTodaySpecial).length} Featured`}
          subtext="promoted on staff & customer Kiosk"
        />
        <StatCard
          label="AVAILABLE ITEMS"
          value={`${menuItems.filter((m) => m.available).length} Active`}
          subtext={`${menuItems.filter((m) => !m.available).length} 86'd / Sold out`}
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
          <span>Full Restaurant Catalog</span>
        </button>
      </div>

      {/* TAB 1: MENU ITEMS */}
      {activeTab === "menu" && (
        <div className="space-y-6">
          {/* Search and Filters Bar */}
          <div className="design-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
              <Input
                placeholder="Search menu items by name or ingredients..."
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
                <option value="Starters">Starters</option>
                <option value="Mains">Mains</option>
                <option value="Desserts">Desserts</option>
                <option value="Beverages">Beverages</option>
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
                <option value="specials">Today's Specials</option>
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
              paginatedMenuItems.map((item) => (
                <div
                  key={item.id}
                  className="design-surface p-6 flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                            {item.category}
                          </span>
                          {item.isTodaySpecial && (
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
                        onClick={() => handleToggleAvailability(item.id)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1",
                          item.available
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
                        )}
                        title="Click to toggle availability"
                      >
                        {item.available ? (
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
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-lg text-slate-900">
                        ₹{item.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        + {item.gstPercent}% GST
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleSpecial(item.id)}
                        className={cn(
                          "h-8 px-2.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors",
                          item.isTodaySpecial
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "text-slate-500 border-slate-200 hover:bg-slate-100"
                        )}
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
              ))
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

      {/* TAB 2: CATALOGUE MANAGEMENT */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          <div className="design-surface p-6">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">
                  MASTER RESTAURANT MENU CATALOG
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  Category Pricing & Availability Roster
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Amounts in ₹ (INR)
              </span>
            </div>

            <div className="space-y-8">
              {catalogSections.map((section) => (
                <div key={section.category} className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80">
                    <span className="font-bold text-sm text-slate-900">{section.category}</span>
                    <span className="text-xs text-slate-500 font-mono font-medium">
                      {section.items.length} dishes
                    </span>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold text-slate-400 uppercase">
                        <TableHead className="py-2.5 px-4 h-auto">DISH NAME</TableHead>
                        <TableHead className="py-2.5 px-4 h-auto text-right">HALF PORTION (₹)</TableHead>
                        <TableHead className="py-2.5 px-4 h-auto text-right">FULL PORTION (₹)</TableHead>
                        <TableHead className="py-2.5 px-4 h-auto text-center">STATUS</TableHead>
                        <TableHead className="py-2.5 px-4 h-auto text-right">ACTIONS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 text-xs">
                      {section.items.map((dish, i) => (
                        <TableRow key={i} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="py-3 px-4 font-semibold text-slate-900">
                            {dish.name}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-right font-mono text-slate-700">
                            {dish.halfPrice !== null ? `₹${dish.halfPrice}` : "—"}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            ₹{dish.fullPrice}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-center">
                            <span
                              className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                                dish.available !== false
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                  : "bg-rose-50 text-rose-600 border-rose-200"
                              )}
                            >
                              {dish.available !== false ? "Available" : "Unavailable"}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditCatalog(dish, section.category)}
                              className="h-7 px-2.5 text-xs text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-lg cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3 mr-1" /> Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Menu Item */}
      <Modal
        isOpen={isAddMenuOpen}
        onClose={() => setIsAddMenuOpen(false)}
        title={editingMenuItem ? "Edit Menu Item" : "Add New Menu Item"}
        subtitle="Specify dish name, category, price, GST, and description."
      >
        <form onSubmit={handleSaveMenuItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dish Name
            </label>
            <Input
              type="text"
              required
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder="e.g. Grilled Sea Bass"
              className="w-full px-3 py-2 h-10 text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={menuCategory}
                onChange={(e) => setMenuCategory(e.target.value)}
                className="w-full px-3 py-2 h-10 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                <option value="Starters">Starters</option>
                <option value="Mains">Mains</option>
                <option value="Desserts">Desserts</option>
                <option value="Beverages">Beverages</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Price (₹)
              </label>
              <Input
                type="number"
                step="0.01"
                required
                value={menuPrice}
                onChange={(e) => setMenuPrice(e.target.value)}
                className="w-full px-3 py-2 h-10 text-xs rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST %
              </label>
              <Input
                type="number"
                required
                value={menuGst}
                onChange={(e) => setMenuGst(e.target.value)}
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

          <div className="flex items-center gap-6 pt-2">
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
              <span>Mark as Today's Special</span>
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
              className="px-5 py-2 h-9 text-xs bg-[#0052ff] hover:bg-[#0046dc] text-white font-semibold rounded-xl border-none"
            >
              Save Menu Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Catalog Item */}
      <Modal
        isOpen={isEditCatalogOpen}
        onClose={() => setIsEditCatalogOpen(false)}
        title="Edit Catalog Item"
        subtitle="Update dish pricing & availability in master catalog."
      >
        <form onSubmit={handleSaveCatalogDish} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dish Name
            </label>
            <Input
              type="text"
              required
              value={catalogDishName}
              onChange={(e) => setCatalogDishName(e.target.value)}
              className="w-full px-3 py-2 h-10 text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={catalogCategory}
                onChange={(e) => setCatalogCategory(e.target.value)}
                className="w-full px-3 py-2 h-10 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                <option value="Veg Starters">Veg Starters</option>
                <option value="Non-Veg Starters">Non-Veg Starters</option>
                <option value="Soups">Soups</option>
                <option value="Main Course">Main Course</option>
                <option value="Biryani">Biryani</option>
                <option value="Chinese">Chinese</option>
                <option value="Desserts & Beverages">Desserts & Beverages</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Half Price (₹)
              </label>
              <Input
                type="number"
                value={catalogHalfPrice}
                onChange={(e) => setCatalogHalfPrice(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 h-10 text-xs rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Price (₹)
              </label>
              <Input
                type="number"
                required
                value={catalogFullPrice}
                onChange={(e) => setCatalogFullPrice(e.target.value)}
                className="w-full px-3 py-2 h-10 text-xs rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={catalogAvailable}
                onChange={(e) => setCatalogAvailable(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Available in Catalog</span>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditCatalogOpen(false)}
              className="px-4 py-2 h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-5 py-2 h-9 text-xs bg-[#0052ff] hover:bg-[#0046dc] text-white font-semibold rounded-xl border-none"
            >
              Update Catalog Item
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
