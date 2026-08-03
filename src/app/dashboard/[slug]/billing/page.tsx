"use client";

import React, { useState, useMemo } from "react";
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
  Receipt,
  Plus,
  Search,
  Eye,
  Printer,
  CreditCard,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  ShoppingBag,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BillItem {
  id: string;
  billNumber: string;
  customerName: string;
  phoneNumber: string;
  assignedStaff: string;
  totalAmount: number;
  subtotal: number;
  gstAmount: number;
  discount: number;
  paymentStatus: "Paid" | "Unpaid" | "Pending";
  paymentMode: string;
  date: string;
  itemsSummary: string;
}

export default function BillingModulePage() {
  // Billing history dataset
  const [bills, setBills] = useState<BillItem[]>([
    {
      id: "B-1084",
      billNumber: "#INV-1084",
      customerName: "Ananya Roy",
      phoneNumber: "+91 98765 43210",
      assignedStaff: "Avery Lin",
      subtotal: 800.0,
      gstAmount: 90.0,
      discount: 0.0,
      totalAmount: 890.0,
      paymentStatus: "Paid",
      paymentMode: "UPI / Online",
      date: "Today, 12:45 PM",
      itemsSummary: "2x Chili Chicken Dry, 2x Schezwan Fried Rice",
    },
    {
      id: "B-1085",
      billNumber: "#INV-1085",
      customerName: "Rohan Kapoor",
      phoneNumber: "+91 98123 45678",
      assignedStaff: "Maya Patel",
      subtotal: 1000.0,
      gstAmount: 120.0,
      discount: 0.0,
      totalAmount: 1120.0,
      paymentStatus: "Paid",
      paymentMode: "Credit Card",
      date: "Today, 01:15 PM",
      itemsSummary: "1x Tandoori Chicken, 3x Butter Naan, 1x Dal Makhani",
    },
    {
      id: "B-1086",
      billNumber: "#INV-1086",
      customerName: "Rahul Sharma",
      phoneNumber: "+91 99887 76655",
      assignedStaff: "Jon Bell",
      subtotal: 1100.0,
      gstAmount: 140.0,
      discount: 0.0,
      totalAmount: 1240.0,
      paymentStatus: "Unpaid",
      paymentMode: "Cash",
      date: "Today, 01:30 PM",
      itemsSummary: "2x Butter Chicken, 4x Butter Naan, 1x Dal Makhani",
    },
    {
      id: "B-1087",
      billNumber: "#INV-1087",
      customerName: "Meera Nair",
      phoneNumber: "+91 97654 32109",
      assignedStaff: "Sophie Martin",
      subtotal: 580.0,
      gstAmount: 30.0,
      discount: 0.0,
      totalAmount: 610.0,
      paymentStatus: "Paid",
      paymentMode: "UPI / PhonePe",
      date: "Today, 01:45 PM",
      itemsSummary: "2x Veg Hakka Noodles, 1x Veg Spring Rolls",
    },
    {
      id: "B-1088",
      billNumber: "#INV-1088",
      customerName: "Vikram Malhotra",
      phoneNumber: "+91 98989 12345",
      assignedStaff: "Hiro Tanaka",
      subtotal: 1000.0,
      gstAmount: 50.0,
      discount: 0.0,
      totalAmount: 1050.0,
      paymentStatus: "Pending",
      paymentMode: "Cash",
      date: "Today, 02:00 PM",
      itemsSummary: "3x Veg Biryani, 3x Gulab Jamun",
    },
  ]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Selected bill for Modal
  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Create Bill Modal State
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);
  const [billCustomer, setBillCustomer] = useState("Karan Verma");
  const [billPhone, setBillPhone] = useState("+91 98765 00112");
  const [billStaff, setBillStaff] = useState("Avery Lin");
  const [selectedDish, setSelectedDish] = useState("Paneer Butter Masala");
  const [dishPrice, setDishPrice] = useState("360");
  const [dishQty, setDishQty] = useState("2");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [paymentMode, setPaymentMode] = useState("Credit Card");
  const [initialPaymentStatus, setInitialPaymentStatus] = useState<"Paid" | "Unpaid">("Paid");

  // Dynamic calculations for Create Bill form
  const calculatedSubtotal = (parseFloat(dishPrice) || 0) * (parseInt(dishQty) || 1);
  const calculatedGst = calculatedSubtotal * 0.05;
  const calculatedGrandTotal = Math.max(0, calculatedSubtotal + calculatedGst - (parseFloat(discountAmount) || 0));

  // Filtered bills list
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const matchesSearch =
        b.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.assignedStaff.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "all" || b.paymentStatus === selectedStatus;
      const matchesMode =
        selectedPaymentMode === "all" ||
        b.paymentMode.toLowerCase().includes(selectedPaymentMode.toLowerCase());

      return matchesSearch && matchesStatus && matchesMode;
    });
  }, [bills, searchQuery, selectedStatus, selectedPaymentMode]);

  // Paginated bills
  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBills.slice(start, start + itemsPerPage);
  }, [filteredBills, currentPage]);

  const totalPages = Math.ceil(filteredBills.length / itemsPerPage) || 1;

  // Summary Stat Calculations
  const stats = useMemo(() => {
    const totalCount = bills.length;
    const paidBills = bills.filter((b) => b.paymentStatus === "Paid");
    const totalRev = paidBills.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const unpaidCount = bills.filter((b) => b.paymentStatus !== "Paid").length;
    const avgTicket = totalCount > 0 ? bills.reduce((acc, b) => acc + b.totalAmount, 0) / totalCount : 0;

    return {
      totalBills: totalCount,
      totalRevenue: `₹${totalRev.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      unpaidBills: unpaidCount,
      avgTicketSize: `₹${avgTicket.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    };
  }, [bills]);

  const handleCreateBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBill: BillItem = {
      id: `B-${Date.now().toString().slice(-4)}`,
      billNumber: `#INV-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: billCustomer,
      phoneNumber: billPhone,
      assignedStaff: billStaff,
      subtotal: calculatedSubtotal,
      gstAmount: calculatedGst,
      discount: parseFloat(discountAmount) || 0,
      totalAmount: calculatedGrandTotal,
      paymentStatus: initialPaymentStatus,
      paymentMode,
      date: "Just now",
      itemsSummary: `${dishQty}x ${selectedDish}`,
    };

    setBills((prev) => [newBill, ...prev]);
    setIsCreateBillOpen(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">POS BILLING & INVOICES</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Billing & Invoices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create customer invoices, track billing history, handle payments, and print receipts.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateBillOpen(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start md:self-auto cursor-pointer border-none"
        >
          <Receipt className="w-4 h-4" />
          <span>Create New Bill</span>
        </Button>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="TODAY'S TOTAL BILLS"
          value={`${stats.totalBills} Invoices`}
          subtext="generated this shift"
        />
        <StatCard
          label="TOTAL PAID REVENUE"
          value={stats.totalRevenue}
          subtext="cleared payments"
        />
        <StatCard
          label="UNPAID / PENDING"
          value={`${stats.unpaidBills} Bills`}
          subtext="awaiting settlement"
        />
        <StatCard
          label="AVERAGE TICKET SIZE"
          value={stats.avgTicketSize}
          subtext="per dining table"
        />
      </div>

      {/* Main Billing Table Surface */}
      <div className="design-surface p-6 space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
            <Input
              placeholder="Search by invoice #, customer or staff..."
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
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none cursor-pointer h-9"
            >
              <option value="all">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Pending">Pending</option>
            </select>

            <select
              value={selectedPaymentMode}
              onChange={(e) => {
                setSelectedPaymentMode(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none cursor-pointer h-9"
            >
              <option value="all">All Payment Modes</option>
              <option value="Card">Credit/Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI / PhonePe / Paytm</option>
            </select>
          </div>
        </div>

        {/* Invoices Data Table */}
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">INVOICE NO.</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">CUSTOMER NAME</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STAFF</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">DATE & TIME</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">TOTAL (₹)</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">PAYMENT MODE</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STATUS</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-xs">
            {paginatedBills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedBills.map((bill) => (
                <TableRow key={bill.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                  <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                    {bill.billNumber}
                  </TableCell>
                  <TableCell className="py-4 px-4 font-semibold text-slate-800">
                    <div>{bill.customerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{bill.phoneNumber}</div>
                  </TableCell>
                  <TableCell className="py-4 px-4 text-slate-600 font-medium">
                    {bill.assignedStaff}
                  </TableCell>
                  <TableCell className="py-4 px-4 font-mono text-slate-500">
                    {bill.date}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{bill.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-slate-700 font-medium">
                    {bill.paymentMode}
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <StatusBadge status={bill.paymentStatus} />
                  </TableCell>
                  <TableCell className="py-4 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setSelectedBill(bill);
                        setIsInvoiceOpen(true);
                      }}
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-100/80 rounded-lg cursor-pointer transition-colors"
                      title="View Tax Invoice"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Page {currentPage} of {totalPages} ({filteredBills.length} total bills)
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

      {/* Modal: View Tax Invoice */}
      {selectedBill && isInvoiceOpen && (
        <Modal
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          title={`Tax Invoice — ${selectedBill.billNumber}`}
        >
          <div className="space-y-4 py-2 text-xs font-mono">
            <div className="text-center pb-3 border-b border-dashed border-slate-300 font-sans">
              <h3 className="font-bold text-base text-slate-900">GRAND BISTRO RESTAURANT</h3>
              <p className="text-xs text-slate-500 mt-0.5">GSTIN: 07AAAAA0000A1Z5 • FSSAI Lic: 11521000000000</p>
              <p className="text-[10px] text-slate-400 mt-1">Invoice: {selectedBill.billNumber} | Date: {selectedBill.date}</p>
            </div>

            <div className="space-y-1 text-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Customer Name:</span>
                <span className="font-bold font-sans">{selectedBill.customerName} ({selectedBill.phoneNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Server / Cashier:</span>
                <span className="font-sans">{selectedBill.assignedStaff}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Payment Method:</span>
                <span className="font-sans font-semibold text-blue-600">{selectedBill.paymentMode}</span>
              </div>
            </div>

            <div className="py-3 border-t border-b border-dashed border-slate-300 space-y-2">
              <div className="font-bold font-sans text-slate-700 uppercase text-[10px]">Ordered Items</div>
              <div className="p-3 bg-slate-50 rounded-lg text-slate-900 font-sans font-medium">
                {selectedBill.itemsSummary}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{selectedBill.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (5%):</span>
                <span>₹{selectedBill.gstAmount.toFixed(2)}</span>
              </div>
              {selectedBill.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>-₹{selectedBill.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-dashed border-slate-300 font-sans">
                <span>GRAND TOTAL:</span>
                <span className="text-blue-600">₹{selectedBill.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 font-sans border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsInvoiceOpen(false)}>
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  alert(`Receipt for ${selectedBill.billNumber} sent to thermal printer!`);
                  setIsInvoiceOpen(false);
                }}
                className="bg-[#0052ff] hover:bg-[#0046dc] text-white font-semibold"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Print Receipt
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Create Bill (POS Billing) */}
      <Modal
        isOpen={isCreateBillOpen}
        onClose={() => setIsCreateBillOpen(false)}
        title="Create New Customer Bill (POS)"
        subtitle="Generate instant bill receipt with GST calculation."
      >
        <form onSubmit={handleCreateBillSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name
              </label>
              <Input
                type="text"
                required
                value={billCustomer}
                onChange={(e) => setBillCustomer(e.target.value)}
                placeholder="e.g. Karan Verma"
                className="w-full px-3 py-2 h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <Input
                type="text"
                required
                value={billPhone}
                onChange={(e) => setBillPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 h-10 text-xs rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Staff / Cashier
              </label>
              <Input
                type="text"
                required
                value={billStaff}
                onChange={(e) => setBillStaff(e.target.value)}
                className="w-full px-3 py-2 h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selected Dish
              </label>
              <select
                value={selectedDish}
                onChange={(e) => setSelectedDish(e.target.value)}
                className="w-full px-3 py-2 h-10 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                <option value="Paneer Butter Masala">Paneer Butter Masala (₹360)</option>
                <option value="Butter Chicken">Butter Chicken (₹450)</option>
                <option value="Hyderabadi Biryani">Hyderabadi Biryani (₹410)</option>
                <option value="Pan-Seared Salmon">Pan-Seared Salmon (₹1,250)</option>
                <option value="Tandoori Pomfret">Tandoori Pomfret (₹950)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Price (₹)
              </label>
              <Input
                type="number"
                required
                value={dishPrice}
                onChange={(e) => setDishPrice(e.target.value)}
                className="w-full px-3 py-2 h-10 text-xs rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity
              </label>
              <Input
                type="number"
                required
                value={dishQty}
                onChange={(e) => setDishQty(e.target.value)}
                className="w-full px-3 py-2 h-10 text-xs rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount (₹)
              </label>
              <Input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-full px-3 py-2 h-10 text-xs rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 h-10 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
                <option value="UPI / PhonePe">UPI / PhonePe</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Status
              </label>
              <select
                value={initialPaymentStatus}
                onChange={(e) => setInitialPaymentStatus(e.target.value as "Paid" | "Unpaid")}
                className="w-full px-3 py-2 h-10 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid / Credit</option>
              </select>
            </div>
          </div>

          {/* Instant Live Billing Breakdown */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900">₹{calculatedSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (5%):</span>
              <span className="font-mono font-semibold text-slate-900">₹{calculatedGst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="font-mono text-blue-600 text-base">₹{calculatedGrandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateBillOpen(false)}
              className="px-4 py-2 h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-5 py-2 h-9 text-xs bg-[#0052ff] hover:bg-[#0046dc] text-white font-semibold rounded-xl border-none"
            >
              Generate Bill
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
