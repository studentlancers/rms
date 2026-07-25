"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Plus,
  Edit2,
  Trash2,
  Receipt,
  Utensils,
  BookOpen,
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
}

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

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState<"menu" | "bills" | "catalog">("menu");

  // Initial Catalog Data with realistic items & prices in INR
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
      category: "Snacks",
      items: [
        { name: "Veg Spring Rolls", halfPrice: 130, fullPrice: 220, available: true },
        { name: "Chicken Nuggets (8 pcs)", halfPrice: 160, fullPrice: 280, available: true },
        { name: "Peri Peri French Fries", halfPrice: 90, fullPrice: 150, available: true },
        { name: "Cheese Garlic Bread", halfPrice: 120, fullPrice: 200, available: true },
      ],
    },
    {
      category: "Desserts",
      items: [
        { name: "Gulab Jamun (2 pcs)", halfPrice: null, fullPrice: 120, available: true },
        { name: "Rasmalai (2 pcs)", halfPrice: null, fullPrice: 150, available: true },
        { name: "Sizzling Brownie with Vanilla Ice Cream", halfPrice: null, fullPrice: 240, available: true },
        { name: "Kesar Pista Kulfi", halfPrice: null, fullPrice: 110, available: true },
      ],
    },
    {
      category: "Beverages",
      items: [
        { name: "Masala Special Chai", halfPrice: null, fullPrice: 60, available: true },
        { name: "Fresh Lime Soda (Sweet / Salt)", halfPrice: null, fullPrice: 110, available: true },
        { name: "Cold Coffee with Ice Cream", halfPrice: null, fullPrice: 160, available: true },
        { name: "Mango Lassi", halfPrice: null, fullPrice: 130, available: true },
      ],
    },
  ];

  const [catalogSections, setCatalogSections] = useState<CatalogSection[]>(initialCatalogSections);

  // Edit Catalog Item Modal state
  const [isEditCatalogOpen, setIsEditCatalogOpen] = useState(false);
  const [catalogOriginalCategory, setCatalogOriginalCategory] = useState("");
  const [catalogOriginalName, setCatalogOriginalName] = useState("");
  const [catalogDishName, setCatalogDishName] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("Veg Starters");
  const [catalogHalfPrice, setCatalogHalfPrice] = useState("");
  const [catalogFullPrice, setCatalogFullPrice] = useState("");
  const [catalogAvailable, setCatalogAvailable] = useState(true);

  // Menu items state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: "M-1",
      name: "Pan-Seared Atlantic Salmon",
      category: "Mains",
      price: 34.0,
      gstPercent: 5,
      description: "Crispy skin salmon with crushed heirloom potatoes & dill emulsion.",
      available: true,
    },
    {
      id: "M-2",
      name: "Burrata di Puglia Salad",
      category: "Starters",
      price: 18.5,
      gstPercent: 5,
      description: "Fresh Puglia burrata, vine tomatoes, basil oil & balsamic reduction.",
      available: true,
    },
    {
      id: "M-3",
      name: "Wagyu Ribeye 300g",
      category: "Mains",
      price: 68.0,
      gstPercent: 5,
      description: "Charcoal grilled MB5+ ribeye with red wine jus & truffle fries.",
      available: true,
    },
    {
      id: "M-4",
      name: "Tiramisu Tradizionale",
      category: "Desserts",
      price: 14.0,
      gstPercent: 5,
      description: "Espresso soaked savoiardi, mascarpone cream & cocoa powder.",
      available: false,
    },
  ]);

  // Bills state
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

  // Add/Edit Menu Item Modal State
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

  // Form states for Menu Item
  const [menuName, setMenuName] = useState("");
  const [menuCategory, setMenuCategory] = useState("Mains");
  const [menuPrice, setMenuPrice] = useState("28.00");
  const [menuGst, setMenuGst] = useState("5");
  const [menuDesc, setMenuDesc] = useState("");
  const [menuAvailable, setMenuAvailable] = useState(true);

  // Create Bill Modal State
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);
  const [billCustomer, setBillCustomer] = useState("Liam Carter");
  const [billStaff, setBillStaff] = useState("Avery Lin");
  const [selectedMenuId, setSelectedMenuId] = useState("M-1");
  const [itemQty, setItemQty] = useState("2");
  const [billDiscount, setBillDiscount] = useState("5.00");
  const [paymentMode, setPaymentMode] = useState("Card");

  // Open Edit Menu Modal
  const openEditMenu = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuName(item.name);
    setMenuCategory(item.category);
    setMenuPrice(item.price.toString());
    setMenuGst(item.gstPercent.toString());
    setMenuDesc(item.description);
    setMenuAvailable(item.available);
    setIsAddMenuOpen(true);
  };

  // Open Edit Catalog Modal pre-filled
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
      // Create deep copy
      let newSections = prevSections.map((sec) => ({
        ...sec,
        items: [...sec.items],
      }));

      // Remove from original category
      newSections = newSections.map((sec) => {
        if (sec.category === catalogOriginalCategory) {
          return {
            ...sec,
            items: sec.items.filter((i) => i.name !== catalogOriginalName),
          };
        }
        return sec;
      });

      // Add/insert into selected category
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

  const handleSaveMenuItem = (e: React.FormEvent) => {
    e.preventDefault();

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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono font-semibold tracking-widest text-blue-600 uppercase mb-2">
            CATALOGUE & POS BILLING
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Menu & Billing
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage food & beverage items, prices, GST rates, and customer billing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* CRITICAL REQUIREMENT: Add Menu Item button ONLY visible on Menu Items tab */}
          {activeTab === "menu" && (
            <button
              onClick={() => {
                setEditingMenuItem(null);
                setMenuName("");
                setMenuDesc("");
                setIsAddMenuOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Menu Item</span>
            </button>
          )}

          {activeTab === "bills" && (
            <button
              onClick={() => setIsCreateBillOpen(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Create Bill</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("menu")}
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
          onClick={() => setActiveTab("bills")}
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
          onClick={() => setActiveTab("catalog")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0",
            activeTab === "catalog"
              ? "bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs"
              : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>Catalog</span>
        </button>
      </div>

      {/* Tab 1: Menu Items Grid */}
      {activeTab === "menu" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="design-surface p-6 flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-lg text-slate-900 mt-2">
                      {item.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditMenu(item)}
                      title="Edit Item"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenuItem(item.id)}
                      title="Delete Item"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-slate-900">
                    ₹{item.price.toFixed(2)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    GST: {item.gstPercent}%
                  </div>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                    item.available
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                      : "bg-slate-100 text-slate-400 border-slate-200/60"
                  )}
                >
                  {item.available ? "Available" : "Out of Stock"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Customer Bills Table */}
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

                    <td className="py-4 px-4 text-slate-600">
                      {bill.assignedStaff}
                    </td>

                    <td className="py-4 px-4 text-slate-500 font-mono">
                      {bill.paymentMode}
                    </td>

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

      {/* Tab 3: Restaurant Menu Catalog with Edit capabilities per row */}
      {activeTab === "catalog" && (
        <div className="design-surface p-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="text-[10px] font-mono font-semibold tracking-wider text-blue-600 uppercase">
                DINING MENU CATALOG
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                Restaurant Catalog & Portion Rates
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-lg self-start sm:self-auto">
              Portion Prices in ₹ (INR)
            </span>
          </div>

          <div className="space-y-8">
            {catalogSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0052ff]" />
                  <h4 className="font-bold text-base text-slate-900 tracking-tight">
                    {section.category}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    ({section.items.length} items)
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                        <th className="py-3 px-4">DISH NAME</th>
                        <th className="py-3 px-4 text-right w-36">HALF PRICE (₹)</th>
                        <th className="py-3 px-4 text-right w-36">FULL PRICE (₹)</th>
                        <th className="py-3 px-4 text-center w-28">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {section.items.map((dish, dIdx) => (
                        <tr
                          key={dIdx}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            <div className="flex items-center gap-2">
                              <span>{dish.name}</span>
                              {dish.available === false && (
                                <span className="text-[10px] font-mono text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
                                  Unavailable
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                            {dish.halfPrice !== null ? `₹${dish.halfPrice}` : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            ₹{dish.fullPrice}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => openEditCatalog(dish, section.category)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 bg-white text-slate-700 hover:text-blue-600 text-xs font-medium transition-all cursor-pointer shadow-2xs"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Edit Catalog Dish */}
      <Modal
        isOpen={isEditCatalogOpen}
        onClose={() => setIsEditCatalogOpen(false)}
        title="Edit Catalog Item"
        subtitle="Update dish name, category, pricing, and availability."
      >
        <form onSubmit={handleSaveCatalogDish} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dish Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Paneer Tikka"
              value={catalogDishName}
              onChange={(e) => setCatalogDishName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category / Section
            </label>
            <select
              value={catalogCategory}
              onChange={(e) => setCatalogCategory(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="Veg Starters">Veg Starters</option>
              <option value="Non-Veg Starters">Non-Veg Starters</option>
              <option value="Soups">Soups</option>
              <option value="Main Course">Main Course</option>
              <option value="Biryani">Biryani</option>
              <option value="Chinese">Chinese</option>
              <option value="Snacks">Snacks</option>
              <option value="Desserts">Desserts</option>
              <option value="Beverages">Beverages</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Half Price (₹) <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <input
                type="number"
                step="1"
                placeholder="e.g. 180 (or leave blank)"
                value={catalogHalfPrice}
                onChange={(e) => setCatalogHalfPrice(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Price (₹)
              </label>
              <input
                type="number"
                step="1"
                required
                placeholder="e.g. 320"
                value={catalogFullPrice}
                onChange={(e) => setCatalogFullPrice(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="catalogAvail"
              checked={catalogAvailable}
              onChange={(e) => setCatalogAvailable(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
            <label htmlFor="catalogAvail" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Item Available in Restaurant Catalog
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditCatalogOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              Save Catalog Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add/Edit Menu Item */}
      <Modal
        isOpen={isAddMenuOpen}
        onClose={() => setIsAddMenuOpen(false)}
        title={editingMenuItem ? "Edit Menu Item" : "Add Menu Item"}
        subtitle="Fill in dish details, pricing, and availability."
      >
        <form onSubmit={handleSaveMenuItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pan-Seared Atlantic Salmon"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
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
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
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
              <input
                type="number"
                step="0.01"
                required
                placeholder="28.00"
                value={menuPrice}
                onChange={(e) => setMenuPrice(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST (%)
              </label>
              <input
                type="number"
                required
                placeholder="5"
                value={menuGst}
                onChange={(e) => setMenuGst(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Dish ingredients, preparation notes..."
              value={menuDesc}
              onChange={(e) => setMenuDesc(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="menuAvail"
              checked={menuAvailable}
              onChange={(e) => setMenuAvailable(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="menuAvail" className="text-xs font-semibold text-slate-800">
              Item Currently Available for Orders
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddMenuOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0052ff] text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              {editingMenuItem ? "Update Item" : "Save Item"}
            </button>
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
