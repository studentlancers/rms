"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
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
  Plus,
  Receipt,
  Utensils,
  BookOpen,
  Printer,
  CreditCard,
  QrCode,
  Banknote,
  Minus,
  Trash2,
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

export default function StaffMenuBillingPage() {
  const [activeTab, setActiveTab] = useState<"menu" | "bills" | "catalog">("menu");

  // Initial Catalog Data matching Owner Menu
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

  const [catalogSections] = useState<CatalogSection[]>(initialCatalogSections);

  // Menu items state matching Owner Menu
  const [menuItems] = useState<MenuItem[]>([
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

  // Bills state matching Owner Menu
  const [bills, setBills] = useState<BillItem[]>([
    {
      id: "B-1",
      billNumber: "#INV-1084",
      customerName: "Sophie Martin",
      assignedStaff: "Alex Rivera",
      totalAmount: "₹86.50",
      paymentStatus: "Paid",
      paymentMode: "Card",
      date: "Today, 12:45 PM",
    },
    {
      id: "B-2",
      billNumber: "#INV-1085",
      customerName: "Thomas Wright",
      assignedStaff: "Sarah Connor",
      totalAmount: "₹162.00",
      paymentStatus: "Paid",
      paymentMode: "UPI/Online",
      date: "Today, 01:15 PM",
    },
    {
      id: "B-3",
      billNumber: "#INV-1086",
      customerName: "Hiro Tanaka",
      assignedStaff: "Alex Rivera",
      totalAmount: "₹240.00",
      paymentStatus: "Unpaid",
      paymentMode: "Cash",
      date: "Today, 01:30 PM",
    },
  ]);

  // Create Bill Modal State
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);
  const [billCustomer, setBillCustomer] = useState("Liam Carter");
  const [selectedMenuId, setSelectedMenuId] = useState("M-1");
  const [itemQty, setItemQty] = useState("2");
  const [billDiscount, setBillDiscount] = useState("5.00");
  const [paymentMode, setPaymentMode] = useState("Card");

  // Print Receipt Modal
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<BillItem | null>(null);

  const handleGenerateBill = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedItem = menuItems.find((i) => i.id === selectedMenuId) || menuItems[0];
    const qty = parseInt(itemQty) || 1;
    const subtotal = selectedItem.price * qty;
    const gstAmount = (subtotal * selectedItem.gstPercent) / 100;
    const disc = parseFloat(billDiscount) || 0;
    const finalVal = Math.max(0, subtotal + gstAmount - disc);

    const newBill: BillItem = {
      id: `B-${bills.length + 1}`,
      billNumber: `#INV-${1087 + bills.length}`,
      customerName: billCustomer || "Guest Customer",
      assignedStaff: "Alex Rivera",
      totalAmount: `₹${finalVal.toFixed(2)}`,
      paymentStatus: "Paid",
      paymentMode: paymentMode,
      date: "Just now",
    };

    setBills((prev) => [newBill, ...prev]);
    setIsCreateBillOpen(false);
    setSelectedBillForPrint(newBill);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header matching Owner Menu */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">MENU & BILLING</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Menu & Billing Terminal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse items, manage guest orders, and issue receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateBillOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer h-auto border-none"
          >
            <Receipt className="w-4 h-4" />
            <span>Create Bill & POS</span>
          </Button>
        </div>
      </div>

      {/* Tabs Row matching Owner Menu */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-px">
        <button
          onClick={() => setActiveTab("menu")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 cursor-pointer",
            activeTab === "menu"
              ? "border-[#0052ff] text-[#0052ff]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          )}
        >
          <Utensils className="w-4 h-4" />
          <span>Active Menu ({menuItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("bills")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 cursor-pointer",
            activeTab === "bills"
              ? "border-[#0052ff] text-[#0052ff]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          )}
        >
          <Receipt className="w-4 h-4" />
          <span>Billing & Invoices ({bills.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("catalog")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 cursor-pointer",
            activeTab === "catalog"
              ? "border-[#0052ff] text-[#0052ff]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>Restaurant Catalog</span>
        </button>
      </div>

      {/* Tab 1: Active Menu Items */}
      {activeTab === "menu" && (
        <div className="design-surface p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Current Menu Dishest</h3>
              <p className="text-xs text-slate-500">Live prices and availability statuses</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">DISH NAME</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">CATEGORY</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">PRICE</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">GST</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {menuItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                  <TableCell className="py-4 px-4 font-semibold text-slate-900">
                    <div>{item.name}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{item.description}</div>
                  </TableCell>
                  <TableCell className="py-4 px-4 text-slate-600">{item.category}</TableCell>
                  <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">₹{item.price.toFixed(2)}</TableCell>
                  <TableCell className="py-4 px-4 font-mono text-slate-500">{item.gstPercent}%</TableCell>
                  <TableCell className="py-4 px-4">
                    <StatusBadge status={item.available ? "Healthy" : "Low"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Tab 2: Billing & Invoices */}
      {activeTab === "bills" && (
        <div className="design-surface p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Settled & Pending Bills</h3>
              <p className="text-xs text-slate-500">View live transactions and print receipts</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">BILL #</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">CUSTOMER</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STAFF</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">TOTAL</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">MODE</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STATUS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {bills.map((b) => (
                <TableRow key={b.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                  <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">{b.billNumber}</TableCell>
                  <TableCell className="py-4 px-4 font-semibold text-slate-800">{b.customerName}</TableCell>
                  <TableCell className="py-4 px-4 text-slate-600">{b.assignedStaff}</TableCell>
                  <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">{b.totalAmount}</TableCell>
                  <TableCell className="py-4 px-4 text-slate-600">{b.paymentMode}</TableCell>
                  <TableCell className="py-4 px-4">
                    <StatusBadge status={b.paymentStatus === "Paid" ? "Healthy" : "Low"} />
                  </TableCell>
                  <TableCell className="py-4 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBillForPrint(b)}
                      className="h-7 px-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1" />
                      Print
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Tab 3: Restaurant Catalog */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          {catalogSections.map((sec, idx) => (
            <div key={idx} className="design-surface p-6">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900">{sec.category}</h3>
                <p className="text-xs text-slate-400">{sec.items.length} items in category</p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                    <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">DISH ITEM</TableHead>
                    <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">HALF PRICE</TableHead>
                    <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">FULL PRICE</TableHead>
                    <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 text-xs">
                  {sec.items.map((dish, i) => (
                    <TableRow key={i} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                      <TableCell className="py-3.5 px-4 font-semibold text-slate-900">{dish.name}</TableCell>
                      <TableCell className="py-3.5 px-4 font-mono text-slate-600">
                        {dish.halfPrice !== null ? `₹${dish.halfPrice}` : "-"}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 font-mono font-bold text-slate-900">₹{dish.fullPrice}</TableCell>
                      <TableCell className="py-3.5 px-4">
                        <StatusBadge status={dish.available ?? true ? "Healthy" : "Low"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Bill & POS Order */}
      <Modal
        isOpen={isCreateBillOpen}
        onClose={() => setIsCreateBillOpen(false)}
        title="Generate Customer Bill"
        subtitle="Select ordered dish, specify quantity, and complete payment settlement."
      >
        <form onSubmit={handleGenerateBill} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Customer Name</label>
            <Input
              type="text"
              required
              value={billCustomer}
              onChange={(e) => setBillCustomer(e.target.value)}
              className="w-full h-10 border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Menu Dish</label>
              <select
                value={selectedMenuId}
                onChange={(e) => setSelectedMenuId(e.target.value)}
                className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-white"
              >
                {menuItems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (₹{m.price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
              <Input
                type="number"
                min="1"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                className="w-full h-10 border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discount Amount (₹)</label>
              <Input
                type="text"
                value={billDiscount}
                onChange={(e) => setBillDiscount(e.target.value)}
                className="w-full h-10 border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-white font-semibold"
              >
                <option value="Card">Card</option>
                <option value="UPI/Online">UPI / Online</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateBillOpen(false)}
              className="px-4 py-2 h-9 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-5 py-2 h-9 rounded-xl bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-sm cursor-pointer border-none"
            >
              Generate Bill
            </Button>
          </div>
        </form>
      </Modal>

      {/* Thermal Receipt Print Modal */}
      {selectedBillForPrint && (
        <Modal
          isOpen={!!selectedBillForPrint}
          onClose={() => setSelectedBillForPrint(null)}
          title={`Thermal Receipt — ${selectedBillForPrint.billNumber}`}
        >
          <div className="space-y-4 py-2 font-mono text-xs">
            <div className="text-center pb-2 border-b border-dashed border-slate-300 font-sans">
              <h3 className="font-bold text-sm text-slate-900">GRAND BISTRO RESTAURANT</h3>
              <p className="text-[10px] text-slate-500">124 Main Street, Gourmet Avenue</p>
              <p className="text-[10px] text-slate-400 mt-1">
                Customer: {selectedBillForPrint.customerName} • Mode: {selectedBillForPrint.paymentMode}
              </p>
            </div>

            <div className="space-y-1 py-1">
              <div className="flex justify-between text-slate-800">
                <span>Pan-Seared Salmon (x2)</span>
                <span>{selectedBillForPrint.totalAmount}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
                <span>TOTAL PAID:</span>
                <span>{selectedBillForPrint.totalAmount}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 font-sans">
              <Button variant="outline" size="sm" onClick={() => setSelectedBillForPrint(null)}>
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  alert("Printed receipt to thermal printer!");
                  setSelectedBillForPrint(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Thermal Receipt</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
