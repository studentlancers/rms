"use client";

import React, { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Receipt,
  Utensils,
  CheckCircle2,
  DollarSign,
  ShoppingCart,
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

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState<"menu" | "bills">("menu");

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
      totalAmount: "$86.50",
      paymentStatus: "Paid",
      paymentMode: "Card",
      date: "Today, 12:45 PM",
    },
    {
      id: "B-2",
      billNumber: "#INV-1085",
      customerName: "Thomas Wright",
      assignedStaff: "Maya Patel",
      totalAmount: "$162.00",
      paymentStatus: "Paid",
      paymentMode: "UPI/Online",
      date: "Today, 01:15 PM",
    },
    {
      id: "B-3",
      billNumber: "#INV-1086",
      customerName: "Hiro Tanaka",
      assignedStaff: "Jon Bell",
      totalAmount: "$240.00",
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

  const handleSaveMenuItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingMenuItem) {
      // Edit existing
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
      // Add new
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
      totalAmount: `$${finalTotal}`,
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

          <button
            onClick={() => setIsCreateBillOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Create Bill</span>
          </button>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => setActiveTab("menu")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2",
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
            "px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2",
            activeTab === "bills"
              ? "bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs"
              : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <Receipt className="w-4 h-4" />
          <span>Customer Bills ({bills.length})</span>
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
                    ${item.price.toFixed(2)}
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
                Price ($)
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
                    {m.name} (${m.price.toFixed(2)})
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
                Discount ($)
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
