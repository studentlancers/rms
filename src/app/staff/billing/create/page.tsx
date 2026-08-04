"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Printer,
  Download,
  Eye,
  X,
  ArrowLeft,
  Plus,
  RefreshCw,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InvoiceRow {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  // Section 1: Header / Restaurant Details
  const [restaurantName, setRestaurantName] = useState("Grand Bistro Restaurant");
  const [starRating, setStarRating] = useState("5-Star Premium Dining");
  const [restaurantAddress, setRestaurantAddress] = useState("123 Gourmet Avenue, Food District");
  const [cityCountry, setCityCountry] = useState("New Delhi, India - 110001");
  const [receptionPhone, setReceptionPhone] = useState("+91 98765 43210");
  const [hotelLicense, setHotelLicense] = useState("GSTIN: 07AAAAA0000A1Z5 | Lic: 11522001000123");

  // Header Right: Title & Invoice Meta
  const [invoiceTitle, setInvoiceTitle] = useState("Restaurant Invoice");
  const [invoiceNumber, setInvoiceNumber] = useState(() => `${Math.floor(1000000 + Math.random() * 9000000)}`);
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const today = new Date();
    return `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  });
  const [cashierName, setCashierName] = useState("Alex Rivera");

  // Section 2: Bill To Customer Info
  const [guestName, setGuestName] = useState("");
  const [homeAddress, setHomeAddress] = useState("+91 98765 11223");
  const [guestCity, setGuestCity] = useState("Table 05 — Main Dining");
  const [loyaltyNumber, setLoyaltyNumber] = useState("ORD-4892");
  const [bookingRef, setBookingRef] = useState("2 Guests (Pax)");

  // Section 3: Line Items (Matches Reference Sample Rows)
  const [rows, setRows] = useState<InvoiceRow[]>([
    { id: "row-1", description: "Pan-Seared Atlantic Salmon", quantity: 2, unitPrice: 1000 },
    { id: "row-2", description: "Wagyu Ribeye Steak 300g", quantity: 1, unitPrice: 2100 },
    { id: "row-3", description: "Truffle Mushroom Risotto", quantity: 2, unitPrice: 750 },
    { id: "row-4", description: "Fresh Lime Soda & Mineral Water", quantity: 4, unitPrice: 120 },
  ]);

  // Tax & Discount Controls
  const [applyGst, setApplyGst] = useState(true);
  const [gstPercent, setGstPercent] = useState(5);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Payment Summary State
  const [paidAmount, setPaidAmount] = useState<number | "">(0);

  // Section 5: Footer Notes
  const [notes, setNotes] = useState(
    "Thank you for dining with us. Full payment required at checkout, incidentals charged separately. Visit again!"
  );

  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Regenerate Invoice Number
  const handleRegenerateInvoiceNo = () => {
    setInvoiceNumber(`${Math.floor(1000000 + Math.random() * 9000000)}`);
  };

  // Row Handlers
  const handleAddLine = () => {
    const newRow: InvoiceRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: "",
      quantity: 1,
      unitPrice: 0,
    };
    setRows((prev) => [...prev, newRow]);
  };

  const handleDeleteLine = (id: string) => {
    if (rows.length <= 1) {
      toast.error("Invoice must contain at least one item line.");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRow = (id: string, field: keyof InvoiceRow, value: any) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  // Calculations
  const calculated = useMemo(() => {
    let subtotal = 0;
    rows.forEach((r) => {
      const q = Number(r.quantity) || 0;
      const p = Number(r.unitPrice) || 0;
      subtotal += q * p;
    });

    const disc = Number(discountAmount) || 0;
    const netSubtotal = Math.max(0, subtotal - disc);
    const gstAmount = applyGst ? (netSubtotal * gstPercent) / 100 : 0;
    const grandTotal = netSubtotal + gstAmount;

    const numPaid = typeof paidAmount === "number" ? paidAmount : parseFloat(paidAmount || "0") || 0;
    const balanceDue = grandTotal - numPaid;

    return {
      subtotal,
      disc,
      netSubtotal,
      gstAmount,
      grandTotal,
      numPaid,
      balanceDue,
    };
  }, [rows, applyGst, gstPercent, discountAmount, paidAmount]);

  // Validation
  const validateForm = (): boolean => {
    const errs: string[] = [];
    if (!guestName.trim()) {
      errs.push("Customer / Guest Name is required.");
    }
    if (rows.length === 0) {
      errs.push("At least one invoice line item is required.");
    }
    rows.forEach((r, idx) => {
      if (!r.description.trim()) {
        errs.push(`Line #${idx + 1} Description cannot be empty.`);
      }
      if (!r.quantity || r.quantity <= 0) {
        errs.push(`Line #${idx + 1} Quantity must be greater than 0.`);
      }
      if (r.unitPrice < 0) {
        errs.push(`Line #${idx + 1} Unit Price cannot be negative.`);
      }
    });

    setValidationErrors(errs);
    if (errs.length > 0) {
      toast.error(errs[0]);
      return false;
    }
    return true;
  };

  // Print
  const handlePrint = () => {
    if (!validateForm()) return;
    window.print();
  };

  // Download PDF
  const handleDownloadPDF = () => {
    if (!validateForm()) return;
    toast.info(`Downloading Invoice-${invoiceNumber}.pdf...`);

    try {
      const printWin = window.open("", "_blank");
      if (!printWin) {
        window.print();
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice-${invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
              .logo-box { width: 100px; height: 70px; border: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #64748b; background: #f8fafc; font-weight: bold; }
              .rest-details { margin-left: 20px; flex: 1; font-size: 12px; line-height: 1.5; border: 1px dashed #e2e8f0; padding: 10px; }
              .title-box { border: 1px border #e2e8f0; padding: 8px 16px; text-align: center; font-weight: bold; font-size: 14px; background: #f8fafc; width: 220px; }
              .divider { border-top: 3px double #0f172a; margin: 20px 0; }
              .meta-grid { display: flex; justify-content: space-between; margin-bottom: 25px; gap: 20px; }
              .bill-to { flex: 1; border: 1px border #e2e8f0; padding: 12px; font-size: 12px; line-height: 1.6; }
              .inv-meta { width: 240px; border: 1px border #e2e8f0; padding: 12px; font-size: 12px; line-height: 1.8; }
              .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
              .table th, .table td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 12px; }
              .table th { background: #f8fafc; text-align: left; font-weight: bold; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .summary-container { display: flex; justify-content: flex-end; margin-bottom: 30px; }
              .summary-table { width: 280px; border-collapse: collapse; font-size: 12px; }
              .summary-table td { border: 1px solid #cbd5e1; padding: 6px 10px; }
              .summary-table .bold { font-weight: bold; background: #f8fafc; }
              .footer-box { border: 1px border #cbd5e1; padding: 15px; font-size: 12px; line-height: 1.5; background: #fafafa; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div style="display: flex; flex: 1;">
                <div class="logo-box">RESTAURANT LOGO</div>
                <div class="rest-details">
                  <strong style="font-size: 16px;">${restaurantName}</strong><br/>
                  <span>${starRating}</span><br/>
                  <span>${restaurantAddress}</span><br/>
                  <span>${cityCountry}</span><br/>
                  <span>Phone: ${receptionPhone}</span><br/>
                  <span>${hotelLicense}</span>
                </div>
              </div>
              <div class="title-box">
                ${invoiceTitle}
              </div>
            </div>

            <div class="divider"></div>

            <div class="meta-grid">
              <div class="bill-to">
                <div style="font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; font-size: 11px; text-transform: uppercase; color: #475569;">Bill To</div>
                <strong>${guestName || "Guest Customer"}</strong><br/>
                Phone: ${homeAddress || "N/A"}<br/>
                Table: ${guestCity}<br/>
                Order No: ${loyaltyNumber}<br/>
                Pax: ${bookingRef}
              </div>
              <div class="inv-meta">
                <div style="display: flex; justify-content: space-between;"><span>Invoice Number:</span> <strong>${invoiceNumber}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>Date:</span> <span>${invoiceDate}</span></div>
                <div style="display: flex; justify-content: space-between;"><span>Cashier:</span> <span>${cashierName}</span></div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-center" style="width: 80px;">Quantity</th>
                  <th class="text-right" style="width: 120px;">Unit price</th>
                  <th class="text-right" style="width: 130px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${rows
                  .map((r) => {
                    const amt = (r.quantity || 0) * (r.unitPrice || 0);
                    return `
                      <tr>
                        <td><strong>${r.description}</strong></td>
                        <td class="text-center">${r.quantity}</td>
                        <td class="text-right">₹${r.unitPrice.toFixed(2)}</td>
                        <td class="text-right"><strong>₹${amt.toFixed(2)}</strong></td>
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
            </table>

            <div class="summary-container">
              <table class="summary-table">
                <tr><td>Subtotal</td><td class="text-right">₹${calculated.subtotal.toFixed(2)}</td></tr>
                ${applyGst ? `<tr><td>GST (${gstPercent}%)</td><td class="text-right">₹${calculated.gstAmount.toFixed(2)}</td></tr>` : ""}
                ${calculated.disc > 0 ? `<tr><td>Discount</td><td class="text-right">-₹${calculated.disc.toFixed(2)}</td></tr>` : ""}
                <tr class="bold"><td>Total</td><td class="text-right">₹${calculated.grandTotal.toFixed(2)}</td></tr>
                <tr><td>Paid Amount</td><td class="text-right">₹${calculated.numPaid.toFixed(2)}</td></tr>
                <tr class="bold"><td>Balance Due</td><td class="text-right" style="color: ${calculated.balanceDue > 0 ? "#dc2626" : "#059669"};">₹${calculated.balanceDue.toFixed(2)}</td></tr>
              </table>
            </div>

            <div class="footer-box">
              <p>${notes}</p>
            </div>

            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `;

      printWin.document.write(html);
      printWin.document.close();
    } catch (e) {
      window.print();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 select-none">
      {/* TOP FLOATING ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 print:hidden">
        <div className="flex items-center gap-2">
          <Link
            href="/staff/billing"
            className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Billing
          </Link>
          <span className="text-slate-300">•</span>
          <span className="design-section-label">RESTAURANT INVOICE SYSTEM</span>
        </div>

        {/* TOP RIGHT ACTION BUTTONS */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => router.push("/staff/billing")}
            className="h-9 px-3.5 rounded-xl text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5 mr-1 text-slate-500" /> Close
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              if (validateForm()) setIsPreviewOpen(true);
            }}
            className="h-9 px-3.5 rounded-xl text-xs font-semibold border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 mr-1 text-blue-600" /> Preview
          </Button>

          <Button
            variant="outline"
            onClick={handlePrint}
            className="h-9 px-3.5 rounded-xl text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 mr-1 text-slate-600" /> Print
          </Button>

          <Button
            onClick={handleDownloadPDF}
            className="h-9 px-4 rounded-xl bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 cursor-pointer border-none"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Validation Banner */}
      {validationErrors.length > 0 && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium space-y-0.5 print:hidden">
          <div className="font-bold flex items-center gap-1.5 text-red-800">
            <span>⚠️ Please fix validation errors before proceeding:</span>
          </div>
          <ul className="list-disc pl-5">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TARGET A4 INVOICE SHEET CANVAS (MATCHING ATTACHED REFERENCE IMAGE EXACTLY) */}
      {/* ========================================================================= */}
      <div
        ref={printRef}
        className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 sm:p-12 space-y-6 text-slate-800 font-sans print:shadow-none print:border-none print:p-0 print:m-0"
      >
        {/* HEADER SECTION (IMAGE REFERENCE: Left Logo + Center Details + Right Title) */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Logo Box */}
            <div className="w-24 h-20 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 flex flex-col items-center justify-center text-center p-2 shrink-0">
              <UtensilsCrossed className="w-6 h-6 text-blue-600 mb-1" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Your Logo</span>
            </div>

            {/* Center Restaurant Details Box */}
            <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 text-xs space-y-1 flex-1 max-w-md">
              <Input
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="h-7 text-base font-bold text-slate-900 border-none bg-transparent p-0 focus-visible:ring-0"
              />
              <Input
                value={starRating}
                onChange={(e) => setStarRating(e.target.value)}
                className="h-5 text-[11px] text-slate-500 border-none bg-transparent p-0 focus-visible:ring-0"
              />
              <Input
                value={restaurantAddress}
                onChange={(e) => setRestaurantAddress(e.target.value)}
                className="h-5 text-[11px] text-slate-600 border-none bg-transparent p-0 focus-visible:ring-0"
              />
              <Input
                value={cityCountry}
                onChange={(e) => setCityCountry(e.target.value)}
                className="h-5 text-[11px] text-slate-600 border-none bg-transparent p-0 focus-visible:ring-0"
              />
              <div className="text-[11px] text-slate-500 font-mono pt-0.5">
                Reception: <input value={receptionPhone} onChange={(e) => setReceptionPhone(e.target.value)} className="bg-transparent border-b border-dashed border-slate-300 outline-none w-32 text-slate-800" />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                License: <input value={hotelLicense} onChange={(e) => setHotelLicense(e.target.value)} className="bg-transparent border-b border-dashed border-slate-300 outline-none w-56 text-slate-800" />
              </div>
            </div>
          </div>

          {/* Right Invoice Title Header Box */}
          <div className="w-full sm:w-64 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60">
            <div className="bg-slate-100/90 px-4 py-2 text-center font-bold text-xs text-slate-800 border-b border-slate-200 uppercase tracking-wider">
              {invoiceTitle}
            </div>
            <div className="p-3 text-right space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest block">Format: A4 Printable</span>
              <span className="text-xs font-mono font-bold text-blue-600">INVOICE TEMPLATE</span>
            </div>
          </div>
        </div>

        {/* DOUBLE DIVIDER LINE (EXACTLY AS IN REFERENCE IMAGE) */}
        <div className="border-t-4 border-double border-slate-800 my-4" />

        {/* CUSTOMER INFORMATION & INVOICE METADATA SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Bill To Block */}
          <div className="md:col-span-7 border border-slate-200 rounded-xl p-4 bg-slate-50/30 space-y-2 text-xs">
            <div className="font-bold text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>Bill To</span>
              <span className="text-red-500 font-mono font-normal text-[10px]">* Customer Name Required</span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[11px] w-24">Guest Name:</span>
                <Input
                  placeholder="[Guest Name]"
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    if (validationErrors.length > 0) setValidationErrors([]);
                  }}
                  className={cn(
                    "h-8 text-xs font-bold text-slate-900 bg-white border-slate-200 flex-1",
                    !guestName.trim() && validationErrors.length > 0 && "border-red-500 bg-red-50/30"
                  )}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[11px] w-24">Phone Number:</span>
                <Input
                  placeholder="[Home Address / Phone]"
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                  className="h-7 text-xs bg-white border-slate-200 flex-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[11px] w-24">Table / Area:</span>
                <Input
                  placeholder="[City, Country / Table]"
                  value={guestCity}
                  onChange={(e) => setGuestCity(e.target.value)}
                  className="h-7 text-xs bg-white border-slate-200 flex-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[11px] w-24">Order Number:</span>
                <Input
                  placeholder="[Loyalty / Order Number]"
                  value={loyaltyNumber}
                  onChange={(e) => setLoyaltyNumber(e.target.value)}
                  className="h-7 text-xs bg-white border-slate-200 flex-1 font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[11px] w-24">Guests / Pax:</span>
                <Input
                  placeholder="[Booking Ref / Pax]"
                  value={bookingRef}
                  onChange={(e) => setBookingRef(e.target.value)}
                  className="h-7 text-xs bg-white border-slate-200 flex-1 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Right: Invoice Metadata Block */}
          <div className="md:col-span-5 border border-slate-200 rounded-xl p-4 bg-slate-50/30 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
              <span className="font-bold text-slate-700">Invoice Number</span>
              <div className="flex items-center gap-1">
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="h-7 text-xs font-bold text-blue-700 bg-white border-slate-300 w-32 text-right"
                />
                <button
                  type="button"
                  onClick={handleRegenerateInvoiceNo}
                  className="p-1 text-slate-400 hover:text-blue-600 transition-colors print:hidden cursor-pointer"
                  title="Generate new invoice number"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
              <span className="font-bold text-slate-700">Date</span>
              <Input
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="h-7 text-xs bg-white border-slate-300 w-32 text-right"
              />
            </div>

            <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
              <span className="font-bold text-slate-700">Cashier Name</span>
              <Input
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="h-7 text-xs bg-white border-slate-300 w-32 text-right font-sans font-medium"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INVOICE ITEMS EDITABLE TABLE (EXACT MATCH FOR REFERENCE COLUMNS & STYLING) */}
        {/* ========================================================================= */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 w-28 text-center">Quantity</th>
                <th className="py-3 px-4 w-36 text-right">Unit price</th>
                <th className="py-3 px-4 w-36 text-right">Amount</th>
                <th className="py-3 px-3 w-14 text-center print:hidden"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row) => {
                const qty = Number(row.quantity) || 0;
                const price = Number(row.unitPrice) || 0;
                const amount = qty * price;

                return (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4">
                      <Input
                        placeholder="Item Description e.g. Room Charges / Main Dish"
                        value={row.description}
                        onChange={(e) => handleUpdateRow(row.id, "description", e.target.value)}
                        className="h-8 text-xs font-semibold text-slate-800 bg-white border-slate-200"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <Input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) =>
                          handleUpdateRow(row.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="h-8 text-xs text-center font-mono font-bold bg-white border-slate-200"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.unitPrice}
                        onChange={(e) =>
                          handleUpdateRow(row.id, "unitPrice", parseFloat(e.target.value) || 0)
                        }
                        className="h-8 text-xs text-right font-mono font-semibold bg-white border-slate-200"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹{amount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => handleDeleteLine(row.id)}
                        className="w-7 h-7 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer mx-auto shadow-xs"
                        title="Delete Row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* BELOW TABLE: + ADD LINE BUTTON & RIGHT SIDE PAYMENT SUMMARY */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
          {/* Left: + Add Line Primary Action Button */}
          <div className="space-y-3 print:hidden">
            <Button
              onClick={handleAddLine}
              className="h-10 px-5 rounded-xl bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 cursor-pointer border-none flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> + Add Line
            </Button>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
                <input
                  type="checkbox"
                  checked={applyGst}
                  onChange={(e) => setApplyGst(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                Apply GST Tax ({gstPercent}%)
              </label>
            </div>
          </div>

          {/* Right: Payment Summary Table (EXACT MATCH FOR REFERENCE IMAGE LAYOUT) */}
          <div className="w-full sm:w-80 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 font-mono text-xs ml-auto">
            <div className="divide-y divide-slate-200">
              <div className="flex justify-between p-2.5 bg-white">
                <span className="font-sans text-slate-600 font-medium">Subtotal</span>
                <span className="font-bold text-slate-800">₹{calculated.subtotal.toFixed(2)}</span>
              </div>

              {applyGst && (
                <div className="flex justify-between p-2.5 bg-white">
                  <span className="font-sans text-slate-600 font-medium">GST ({gstPercent}%)</span>
                  <span className="font-bold text-slate-800">+₹{calculated.gstAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between p-2.5 bg-slate-100/80 font-bold font-sans text-slate-900 text-sm">
                <span>Total</span>
                <span className="font-mono text-blue-700 text-base">₹{calculated.grandTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-white">
                <span className="font-sans text-slate-600 font-medium">Paid Amount</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                  className="h-7 text-xs font-mono font-bold text-right bg-white border-slate-300 w-32"
                />
              </div>

              <div className="flex justify-between p-2.5 bg-slate-100/90 font-bold font-sans text-slate-900">
                <span>Balance Due</span>
                <span
                  className={cn(
                    "font-mono text-sm",
                    calculated.balanceDue > 0 ? "text-red-600" : "text-emerald-700"
                  )}
                >
                  ₹{calculated.balanceDue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER NOTES SECTION (FULL WIDTH BORDERED BOX EXACTLY AS IN IMAGE) */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 text-xs space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 print:hidden">
            Invoice Notes & Disclaimer:
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[60px] text-xs text-slate-700 bg-white border-slate-200 font-sans leading-relaxed"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PREVIEW MODAL (DIALOG COMPONENT) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Restaurant Tax Invoice — #${invoiceNumber}`}
        subtitle="Review document layout before printing or downloading."
        className="max-w-3xl"
      >
        <div className="space-y-6 py-2 text-xs font-sans">
          {/* Printable Receipt Preview Card */}
          <div className="p-6 border border-slate-200 rounded-xl bg-white space-y-4">
            <div className="flex justify-between items-start border-b border-dashed border-slate-300 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 uppercase">{restaurantName}</h3>
                <p className="text-slate-500 text-xs">{restaurantAddress}, {cityCountry}</p>
                <p className="text-slate-400 font-mono text-[10px] mt-0.5">{hotelLicense}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-blue-700 font-mono">#{invoiceNumber}</span>
                <p className="text-slate-500 text-xs">{invoiceDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Bill To</span>
                <span className="font-bold text-slate-900">{guestName || "Guest Customer"}</span>
                <p className="text-slate-600">{homeAddress}</p>
                <p className="text-slate-600">{guestCity}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Staff Details</span>
                <p className="text-slate-700 font-medium">Cashier: {cashierName}</p>
                <p className="text-slate-600">Order: {loyaltyNumber}</p>
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                  <th className="p-2">Description</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Unit Price</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="p-2 font-sans font-medium">{r.description}</td>
                    <td className="p-2 text-center">{r.quantity}</td>
                    <td className="p-2 text-right">₹{(r.unitPrice || 0).toFixed(2)}</td>
                    <td className="p-2 text-right font-bold">₹{((r.quantity || 0) * (r.unitPrice || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-64 space-y-1 font-mono text-xs border-t border-slate-800 pt-2">
                <div className="flex justify-between"><span>Subtotal:</span><span>₹{calculated.subtotal.toFixed(2)}</span></div>
                {applyGst && <div className="flex justify-between"><span>GST ({gstPercent}%):</span><span>₹{calculated.gstAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-sm text-blue-700 border-t border-slate-200 pt-1">
                  <span>Total:</span><span>₹{calculated.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600"><span>Paid:</span><span>₹{calculated.numPaid.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-red-600"><span>Balance Due:</span><span>₹{calculated.balanceDue.toFixed(2)}</span></div>
              </div>
            </div>

            {notes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs italic">
                "{notes}"
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="h-9 px-4 text-xs cursor-pointer">
              Back to Edit
            </Button>
            <Button onClick={() => { setIsPreviewOpen(false); handlePrint(); }} className="h-9 px-4 bg-slate-900 text-white text-xs cursor-pointer">
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Now
            </Button>
            <Button onClick={() => { setIsPreviewOpen(false); handleDownloadPDF(); }} className="h-9 px-4 bg-blue-600 text-white text-xs cursor-pointer border-none">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download PDF
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
