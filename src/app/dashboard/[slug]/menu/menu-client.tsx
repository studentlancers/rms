"use client";

import React, { useState, useMemo, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
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
  Receipt,
  Utensils,
  BookOpen,
  Loader2,
  AlertCircle,
  Search,
  CheckCircle,
  XCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/menu";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Shape returned by listCategories() — Category with all its items included.
interface PrismaCategory {
  id: string;
  name: string;
  sortOrder: number;
  restaurantId: string;
  menuItems: PrismaMenuItem[];
}

interface PrismaMenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  // JSON field — stored as unknown by Prisma at runtime
  variants: unknown;
}

// Local UI shape for the Menu Items tab grid
interface MenuItem {
  id: string;
  name: string;
  categoryId: string;       // real FK used for mutations
  category: string;         // display name shown in badge
  price: number;
  gstPercent: number;       // UI-only, no DB column — defaults to 5
  description: string;
  isVeg: boolean;
  available: boolean;
  isTodaySpecial: boolean;  // UI-only flag, no DB column
}

// Local UI shapes for the Catalog tab
interface CatalogItem {
  id: string;               // real MenuItem id needed for updateMenuItem()
  name: string;
  halfPrice: number | null; // derived from variants JSON
  fullPrice: number;
  available?: boolean;
}

interface CatalogSection {
  categoryId: string;       // needed to pass categoryId to updateMenuItem()
  category: string;
  items: CatalogItem[];
}

// Bills tab — no Prisma model, stays local-only
interface BillItem {
  id: string;
  billNumber: string;
  customerName: string;
  assignedStaff: string;
  totalAmount: string;
  paymentStatus: "Paid" | "Unpaid" | "Completed";
  paymentMode: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Adapter helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the half-price from a MenuItem's variants JSON field.
 * Convention: a variant with name === "Half" stores the half-portion price
 * as `priceModifier` (a delta; actual half price = item.price + priceModifier).
 */
function extractHalfPrice(itemPrice: number, variants: unknown): number | null {
  if (!Array.isArray(variants)) return null;
  const half = (variants as { name: string; priceModifier: number }[]).find(
    (v) => v.name === "Half"
  );
  if (!half) return null;
  return Math.round(itemPrice + half.priceModifier);
}

/** Encodes halfPrice back into the variants array expected by the action. */
function buildVariants(
  fullPrice: number,
  halfPrice: string
): { name: string; priceModifier: number }[] | undefined {
  const half = halfPrice.trim() !== "" ? parseFloat(halfPrice) : null;
  if (half === null) return undefined;
  return [{ name: "Half", priceModifier: half - fullPrice }];
}

/** Converts a Prisma MenuItem to the local UI MenuItem shape. */
function toMenuItem(item: PrismaMenuItem, categoryName: string): MenuItem {
  return {
    id: item.id,
    categoryId: item.categoryId,
    category: categoryName,
    name: item.name,
    price: item.price,
    gstPercent: 5,          // UI-only default; no DB column
    description: item.description ?? "",
    isVeg: (item as any).isVeg ?? false,
    available: item.isAvailable,
    isTodaySpecial: false,  // UI-only flag; no DB column
  };
}

/** Converts Prisma Category[] to CatalogSection[] for the Catalog tab. */
function toCatalogSections(categories: PrismaCategory[]): CatalogSection[] {
  return categories.map((cat) => ({
    categoryId: cat.id,
    category: cat.name,
    items: cat.menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      halfPrice: extractHalfPrice(item.price, item.variants),
      fullPrice: item.price,
      available: item.isAvailable,
    })),
  }));
}

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------

interface MenuClientProps {
  initialCategories: PrismaCategory[];
}

// ---------------------------------------------------------------------------
// MenuClient
// ---------------------------------------------------------------------------

export default function MenuClient({ initialCategories }: MenuClientProps) {
  const [activeTab, setActiveTab] = useState<"menu" | "bills" | "catalog">("menu");

  // ---- Menu Items state (seeded from real DB data) ----
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() =>
    initialCategories.flatMap((cat) =>
      cat.menuItems.map((item) => toMenuItem(item, cat.name))
    )
  );

  // ---- Catalog state (seeded from real DB data) ----
  const [catalogSections, setCatalogSections] = useState<CatalogSection[]>(() =>
    toCatalogSections(initialCategories)
  );

  // ---- Bills state — no Prisma model; stays local ----
  const [bills, setBills] = useState<BillItem[]>([
    {
      id: "B-1",
      billNumber: "#INV-1084",
      customerName: "Sophie Martin",
      assignedStaff: "Avery Lin",
      totalAmount: "₹86.50",
      paymentStatus: "Paid",
      paymentMode: "Card",
      date: "Today, 12:45 PM",
    },
    {
      id: "B-2",
      billNumber: "#INV-1085",
      customerName: "Thomas Wright",
      assignedStaff: "Maya Patel",
      totalAmount: "₹162.00",
      paymentStatus: "Paid",
      paymentMode: "UPI/Online",
      date: "Today, 01:15 PM",
    },
    {
      id: "B-3",
      billNumber: "#INV-1086",
      customerName: "Hiro Tanaka",
      assignedStaff: "Jon Bell",
      totalAmount: "₹240.00",
      paymentStatus: "Unpaid",
      paymentMode: "Cash",
      date: "Today, 01:30 PM",
    },
  ]);

  // ---- Search / filter / pagination ----
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // ---- Pending / error state ----
  const [isPending, startTransition] = useTransition();
  const [menuModalError, setMenuModalError] = useState<string | null>(null);
  const [catalogModalError, setCatalogModalError] = useState<string | null>(null);

  // ---- Add/Edit Menu Item Modal state ----
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

  // Form fields for the Menu Item modal
  const [menuName, setMenuName] = useState("");
  const [menuCategoryId, setMenuCategoryId] = useState(
    initialCategories[0]?.id ?? ""
  );
  const [menuPrice, setMenuPrice] = useState("450.00");
  const [menuGst, setMenuGst] = useState("5");
  const [menuDesc, setMenuDesc] = useState("");
  const [menuIsVeg, setMenuIsVeg] = useState(false);
  const [menuAvailable, setMenuAvailable] = useState(true);
  const [menuIsSpecial, setMenuIsSpecial] = useState(false);

  // ---- Add/Edit Category Modal state ----
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; sortOrder: number } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySort, setNewCategorySort] = useState("0");
  const [categoryModalError, setCategoryModalError] = useState<string | null>(null);

  // ---- Edit Catalog Item Modal state ----
  const [isEditCatalogOpen, setIsEditCatalogOpen] = useState(false);
  const [editingCatalogItemId, setEditingCatalogItemId] = useState<string | null>(null);
  const [catalogOriginalCategoryId, setCatalogOriginalCategoryId] = useState("");
  const [catalogOriginalName, setCatalogOriginalName] = useState("");
  const [catalogDishName, setCatalogDishName] = useState("");
  // Holds a real categoryId (not a display name string)
  const [catalogCategoryId, setCatalogCategoryId] = useState(
    initialCategories[0]?.id ?? ""
  );
  const [catalogHalfPrice, setCatalogHalfPrice] = useState("");
  const [catalogFullPrice, setCatalogFullPrice] = useState("");
  const [catalogAvailable, setCatalogAvailable] = useState(true);

  // ---- Create Bill Modal state (local-only) ----
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);
  const [billCustomer, setBillCustomer] = useState("Liam Carter");
  const [billStaff, setBillStaff] = useState("Avery Lin");
  const [selectedMenuId, setSelectedMenuId] = useState(menuItems[0]?.id ?? "");
  const [itemQty, setItemQty] = useState("2");
  const [billDiscount, setBillDiscount] = useState("5.00");
  const [paymentMode, setPaymentMode] = useState("Card");

  // ---------------------------------------------------------------------------
  // Derived / memoized values
  // ---------------------------------------------------------------------------

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesAvailability =
        selectedAvailability === "all" ||
        (selectedAvailability === "available" && item.available) ||
        (selectedAvailability === "unavailable" && !item.available) ||
        (selectedAvailability === "specials" && item.isTodaySpecial);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [menuItems, searchQuery, selectedCategory, selectedAvailability]);

  const paginatedMenuItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMenuItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMenuItems, currentPage]);

  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage) || 1;

  // ---------------------------------------------------------------------------
  // Handlers — Menu Items
  // ---------------------------------------------------------------------------

  const handleToggleAvailability = (id: string) => {
    const item = menuItems.find((m) => m.id === id);
    if (!item) return;
    const nextAvailable = !item.available;

    // Optimistic update
    setMenuItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, available: nextAvailable } : m))
    );

    // Also sync catalog tab
    setCatalogSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        items: sec.items.map((dish) =>
          dish.id === id ? { ...dish, available: nextAvailable } : dish
        ),
      }))
    );

    startTransition(async () => {
      try {
        await toggleMenuItemAvailability(id, nextAvailable);
      } catch (err) {
        // Revert both
        setMenuItems((prev) =>
          prev.map((m) => (m.id === id ? { ...m, available: item.available } : m))
        );
        setCatalogSections((prev) =>
          prev.map((sec) => ({
            ...sec,
            items: sec.items.map((dish) =>
              dish.id === id ? { ...dish, available: item.available } : dish
            ),
          }))
        );
        alert(err instanceof Error ? err.message : "Failed to toggle availability");
      }
    });
  };

  const handleToggleSpecial = (id: string) => {
    // isTodaySpecial is UI-only — no server action needed
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isTodaySpecial: !item.isTodaySpecial } : item
      )
    );
  };

  const openEditMenu = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuName(item.name);
    setMenuCategoryId(item.categoryId);
    setMenuPrice(item.price.toString());
    setMenuGst(item.gstPercent.toString());
    setMenuDesc(item.description);
    setMenuIsVeg(item.isVeg);
    setMenuAvailable(item.available);
    setMenuIsSpecial(item.isTodaySpecial);
    setMenuModalError(null);
    setIsAddMenuOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Handlers — Categories
  // ---------------------------------------------------------------------------

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCategoryModalError(null);

    const formData = new FormData();
    formData.set("name", newCategoryName.trim());
    formData.set("sortOrder", newCategorySort);

    setIsAddCategoryOpen(false);

    startTransition(async () => {
      try {
        if (editingCategory) {
          await updateCategory(editingCategory.id, {
            name: newCategoryName.trim(),
            sortOrder: parseInt(newCategorySort, 10) || 0,
          });
        } else {
          await createCategory(formData);
        }
        // Reload the page to get fresh server data (server component re-renders)
        window.location.reload();
      } catch (err) {
        setCategoryModalError(
          err instanceof Error ? err.message : "Failed to save category"
        );
        setIsAddCategoryOpen(true);
      }
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!confirm("Deleting this category will also delete all items inside it. Proceed?")) return;

    startTransition(async () => {
      try {
        await deleteCategory(categoryId);
        window.location.reload();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete category");
      }
    });
  };

  const handleSaveMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuName.trim()) return;
    if (!menuCategoryId) {
      setMenuModalError("Please select or create a category first");
      return;
    }
    setMenuModalError(null);

    const formData = new FormData();
    formData.set("name", menuName);
    formData.set("categoryId", menuCategoryId);
    formData.set("price", menuPrice);
    formData.set("description", menuDesc);
    formData.set("isVeg", menuIsVeg ? "true" : "false");
    formData.set("isAvailable", menuAvailable ? "true" : "false");

    if (editingMenuItem) {
      // ---- UPDATE ----
      const prevItem = editingMenuItem;
      // Optimistic update
      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === prevItem.id
            ? {
                ...item,
                name: menuName,
                categoryId: menuCategoryId,
                category:
                  initialCategories.find((c) => c.id === menuCategoryId)?.name ??
                  item.category,
                price: parseFloat(menuPrice) || 0,
                gstPercent: parseFloat(menuGst) || 5,
                description: menuDesc,
                isVeg: menuIsVeg,
                available: menuAvailable,
                isTodaySpecial: menuIsSpecial,
              }
            : item
        )
      );
      setIsAddMenuOpen(false);
      setEditingMenuItem(null);
      setMenuName("");
      setMenuDesc("");

      startTransition(async () => {
        try {
          const updated = await updateMenuItem(prevItem.id, {
            name: menuName,
            categoryId: menuCategoryId,
            price: parseFloat(menuPrice) || 0,
            description: menuDesc,
            isVeg: menuIsVeg,
            isAvailable: menuAvailable,
          });
          // Replace optimistic entry with confirmed DB record
          setMenuItems((prev) =>
            prev.map((item) =>
              item.id === updated.id
                ? {
                    ...toMenuItem(
                      updated,
                      initialCategories.find((c) => c.id === updated.categoryId)
                        ?.name ?? item.category
                    ),
                    isTodaySpecial: menuIsSpecial,
                  }
                : item
            )
          );
        } catch (err) {
          // Revert optimistic update
          setMenuItems((prev) =>
            prev.map((item) => (item.id === prevItem.id ? prevItem : item))
          );
          setEditingMenuItem(prevItem);
          setMenuName(prevItem.name);
          setMenuCategoryId(prevItem.categoryId);
          setMenuPrice(prevItem.price.toString());
          setMenuGst(prevItem.gstPercent.toString());
          setMenuDesc(prevItem.description);
          setMenuIsVeg(prevItem.isVeg);
          setMenuAvailable(prevItem.available);
          setMenuIsSpecial(prevItem.isTodaySpecial);
          setMenuModalError(
            err instanceof Error ? err.message : "Failed to update item"
          );
          setIsAddMenuOpen(true);
        }
      });
    } else {
      // ---- CREATE ----
      setIsAddMenuOpen(false);
      setMenuName("");
      setMenuDesc("");

      startTransition(async () => {
        try {
          const created = await createMenuItem(formData);
          setMenuItems((prev) => [
            ...prev,
            {
              ...toMenuItem(
                created,
                initialCategories.find((c) => c.id === created.categoryId)
                  ?.name ?? menuCategoryId
              ),
              isTodaySpecial: menuIsSpecial,
            },
          ]);
        } catch (err) {
          setMenuModalError(
            err instanceof Error ? err.message : "Failed to create item"
          );
          setIsAddMenuOpen(true);
        }
      });
    }
  };

  const handleDeleteMenuItem = (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    const removedItem = menuItems.find((item) => item.id === id);
    if (!removedItem) return;

    // Optimistic remove
    setMenuItems((prev) => prev.filter((item) => item.id !== id));

    startTransition(async () => {
      try {
        await deleteMenuItem(id);
      } catch (err) {
        // Revert
        setMenuItems((prev) => [...prev, removedItem]);
        alert(err instanceof Error ? err.message : "Failed to delete item");
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Handlers — Catalog
  // ---------------------------------------------------------------------------

  const openEditCatalog = (
    dish: CatalogItem,
    sectionCategoryId: string
  ) => {
    setEditingCatalogItemId(dish.id);
    setCatalogOriginalCategoryId(sectionCategoryId);
    setCatalogOriginalName(dish.name);
    setCatalogDishName(dish.name);
    setCatalogCategoryId(sectionCategoryId);
    setCatalogHalfPrice(dish.halfPrice !== null ? dish.halfPrice.toString() : "");
    setCatalogFullPrice(dish.fullPrice.toString());
    setCatalogAvailable(dish.available ?? true);
    setCatalogModalError(null);
    setIsEditCatalogOpen(true);
  };

  const handleSaveCatalogDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogDishName.trim() || !editingCatalogItemId) return;
    setCatalogModalError(null);

    const newFullPrice = parseFloat(catalogFullPrice) || 0;
    const newVariants = buildVariants(newFullPrice, catalogHalfPrice);

    const updatedDish: CatalogItem = {
      id: editingCatalogItemId,
      name: catalogDishName.trim(),
      halfPrice: catalogHalfPrice.trim() !== "" ? parseFloat(catalogHalfPrice) : null,
      fullPrice: newFullPrice,
      available: catalogAvailable,
    };

    // Optimistic update in catalogSections
    setCatalogSections((prevSections) => {
      let newSections = prevSections.map((sec) => ({
        ...sec,
        items: [...sec.items],
      }));

      // Remove from original category
      newSections = newSections.map((sec) => {
        if (sec.categoryId === catalogOriginalCategoryId) {
          return {
            ...sec,
            items: sec.items.filter((i) => i.name !== catalogOriginalName),
          };
        }
        return sec;
      });

      // Add into selected category
      let categoryExists = false;
      newSections = newSections.map((sec) => {
        if (sec.categoryId === catalogCategoryId) {
          categoryExists = true;
          return { ...sec, items: [...sec.items, updatedDish] };
        }
        return sec;
      });

      if (!categoryExists) {
        const catName =
          initialCategories.find((c) => c.id === catalogCategoryId)?.name ??
          catalogCategoryId;
        newSections.push({
          categoryId: catalogCategoryId,
          category: catName,
          items: [updatedDish],
        });
      }

      return newSections;
    });

    // Also sync menuItems tab
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === editingCatalogItemId
          ? {
              ...item,
              name: catalogDishName.trim(),
              categoryId: catalogCategoryId,
              category:
                initialCategories.find((c) => c.id === catalogCategoryId)
                  ?.name ?? item.category,
              price: newFullPrice,
              available: catalogAvailable,
            }
          : item
      )
    );

    setIsEditCatalogOpen(false);

    startTransition(async () => {
      try {
        await updateMenuItem(editingCatalogItemId, {
          name: catalogDishName.trim(),
          categoryId: catalogCategoryId,
          price: newFullPrice,
          isAvailable: catalogAvailable,
          ...(newVariants !== undefined ? { variants: newVariants } : {}),
        });
      } catch (err) {
        setCatalogModalError(
          err instanceof Error ? err.message : "Failed to save catalog item"
        );
        setIsEditCatalogOpen(true);
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Handlers — Bills (local-only, no server action)
  // ---------------------------------------------------------------------------

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const itemObj = menuItems.find((m) => m.id === selectedMenuId) || menuItems[0];
    const qty = parseInt(itemQty) || 1;
    const subtotal = itemObj.price * qty;
    const gstAmt = (subtotal * itemObj.gstPercent) / 100;
    const disc = parseFloat(billDiscount) || 0;
    const finalTotal = Math.max(0, subtotal + gstAmt - disc).toFixed(2);

    const newBill: BillItem = {
      id: `B-${Date.now().toString().slice(-3)}`,
      billNumber: `#INV-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: billCustomer,
      assignedStaff: billStaff,
      totalAmount: `₹${finalTotal}`,
      paymentStatus: "Paid",
      paymentMode,
      date: "Just now",
    };

    setBills((prev) => [newBill, ...prev]);
    setIsCreateBillOpen(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">RESTAURANT CATALOGUE &amp; PRICING</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Menu Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage food &amp; beverage items, categories, pricing, GST rates, availability, and Today&apos;s Specials.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          {/* Add Category button — always visible */}
          <Button
            variant="outline"
            onClick={() => {
              setEditingCategory(null);
              setNewCategoryName("");
              setNewCategorySort(String(initialCategories.length));
              setCategoryModalError(null);
              setIsAddCategoryOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold border-slate-200 hover:bg-slate-50 cursor-pointer h-auto"
          >
            <FolderPlus className="w-4 h-4 text-blue-600" />
            <span>Add Category</span>
          </Button>

          {activeTab === "menu" && (
            <Button
              onClick={() => {
                setEditingMenuItem(null);
                setMenuName("");
                setMenuDesc("");
                setMenuCategoryId(initialCategories[0]?.id ?? "");
                setMenuIsVeg(false);
                setMenuIsSpecial(false);
                setMenuModalError(null);
                setIsAddMenuOpen(true);
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer border-none h-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Menu Item</span>
            </Button>
          )}

          {activeTab === "bills" && (
            <Button
              onClick={() => setIsCreateBillOpen(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer border-none h-auto"
            >
              <Receipt className="w-4 h-4" />
              <span>Create Bill</span>
            </Button>
          )}
        </div>
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
          subtext="promoted on staff &amp; customer Kiosk"
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
          onClick={() => { setActiveTab("menu"); setCurrentPage(1); }}
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
          onClick={() => { setActiveTab("bills"); setCurrentPage(1); }}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0",
            activeTab === "bills"
              ? "bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs"
              : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <Receipt className="w-4 h-4" />
          <span>Customer Bills ({bills.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab("catalog"); setCurrentPage(1); }}
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
              {/* Filter by real category names */}
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none cursor-pointer h-9"
              >
                <option value="all">All Categories</option>
                {initialCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedAvailability}
                onChange={(e) => { setSelectedAvailability(e.target.value); setCurrentPage(1); }}
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
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            item.isVeg
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          )}>
                            {item.isVeg ? "VEG" : "NON-VEG"}
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

                      {/* Inline availability toggle — calls real server action */}
                      <button
                        onClick={() => handleToggleAvailability(item.id)}
                        disabled={isPending}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 disabled:opacity-60",
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

      {/* TAB 2: CUSTOMER BILLS */}
      {activeTab === "bills" && (
        <div className="design-surface p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Bills Register</h3>
            <span className="text-xs font-mono text-slate-400">POS INVOICES</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                  <th className="py-3 px-4">BILL NUMBER</th>
                  <th className="py-3 px-4">CUSTOMER NAME</th>
                  <th className="py-3 px-4">ASSIGNED STAFF</th>
                  <th className="py-3 px-4">PAYMENT MODE</th>
                  <th className="py-3 px-4">TOTAL AMOUNT</th>
                  <th className="py-3 px-4">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-semibold text-blue-600">
                      {bill.billNumber}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-900">
                      {bill.customerName}
                    </td>
                    <td className="py-4 px-4 text-slate-600">{bill.assignedStaff}</td>
                    <td className="py-4 px-4 text-slate-500 font-mono">{bill.paymentMode}</td>
                    <td className="py-4 px-4 font-bold text-slate-900 font-mono">
                      {bill.totalAmount}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={bill.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CATALOGUE MANAGEMENT */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          <div className="design-surface p-6">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">
                  MASTER RESTAURANT MENU CATALOG
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  Category Pricing &amp; Availability Roster
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">Amounts in ₹ (INR)</span>
            </div>

            <div className="space-y-8">
              {catalogSections.map((section) => {
                const cat = initialCategories.find((c) => c.id === section.categoryId);
                return (
                <div key={section.categoryId} className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-slate-900">{section.category}</span>
                      {cat && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded">
                          Sort: {cat.sortOrder}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono font-medium mr-2">
                        {section.items.length} dishes
                      </span>
                      {cat && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(cat);
                              setNewCategoryName(cat.name);
                              setNewCategorySort(String(cat.sortOrder));
                              setCategoryModalError(null);
                              setIsAddCategoryOpen(true);
                            }}
                            className="h-7 px-2 text-xs text-slate-600 hover:bg-slate-200 rounded"
                            disabled={isPending}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50 rounded"
                            disabled={isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
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
                              onClick={() => openEditCatalog(dish, section.categoryId)}
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
                );
              })}
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
          {/* Inline error */}
          {menuModalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{menuModalError}</span>
            </div>
          )}

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
              {/* Real categories from DB — value is categoryId */}
              <select
                value={menuCategoryId}
                onChange={(e) => setMenuCategoryId(e.target.value)}
                className="w-full px-3 py-2 h-10 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                {initialCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
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
              disabled={isPending}
              className="px-5 py-2 h-9 text-xs bg-[#0052ff] hover:bg-[#0046dc] disabled:opacity-60 text-white font-semibold rounded-xl border-none flex items-center gap-1.5"
            >
              {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              {editingMenuItem ? "Update Item" : "Save Menu Item"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Catalog Item */}
      <Modal
        isOpen={isEditCatalogOpen}
        onClose={() => setIsEditCatalogOpen(false)}
        title="Edit Catalog Item"
        subtitle="Update dish pricing &amp; availability in master catalog."
      >
        <form onSubmit={handleSaveCatalogDish} className="space-y-4">
          {/* Inline error */}
          {catalogModalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{catalogModalError}</span>
            </div>
          )}

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
              {/* Real categories from DB — value is categoryId */}
              <select
                value={catalogCategoryId}
                onChange={(e) => setCatalogCategoryId(e.target.value)}
                className="w-full px-3 py-2 h-10 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                {initialCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
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
              disabled={isPending}
              className="px-5 py-2 h-9 text-xs bg-[#0052ff] hover:bg-[#0046dc] disabled:opacity-60 text-white font-semibold rounded-xl border-none flex items-center gap-1.5"
            >
              {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Update Catalog Item
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
          {categoryModalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{categoryModalError}</span>
            </div>
          )}

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
              disabled={isPending}
              className="px-5 py-2 h-9 text-xs bg-[#0052ff] hover:bg-[#0046dc] disabled:opacity-60 text-white font-semibold rounded-xl border-none flex items-center gap-1.5"
            >
              {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              {editingCategory ? "Update Category" : "Save Category"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Customer Bill */}
      <Modal
        isOpen={isCreateBillOpen}
        onClose={() => setIsCreateBillOpen(false)}
        title="Create Customer Bill"
        subtitle="Select ordered menu items, assign staff, and calculate total."
      >
        <form onSubmit={handleCreateBill} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                required
                value={billCustomer}
                onChange={(e) => setBillCustomer(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Staff
              </label>
              <input
                type="text"
                required
                value={billStaff}
                onChange={(e) => setBillStaff(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Menu Item
              </label>
              <select
                value={selectedMenuId}
                onChange={(e) => setSelectedMenuId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {menuItems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (₹{m.price.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                step="0.5"
                value={billDiscount}
                onChange={(e) => setBillDiscount(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="Card">Card</option>
                <option value="Cash">Cash</option>
                <option value="UPI/Online">UPI/Online</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateBillOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0052ff] text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              Generate Bill
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
