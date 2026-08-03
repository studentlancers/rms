"use client";

import React, { use } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Printer,
  Receipt,
  User,
  Phone,
  Globe,
  Clock,
  CheckCircle2,
  Bike,
  CreditCard,
  FileText,
  ShoppingBag,
  ChefHat,
} from "lucide-react";

interface PlatformOrderDetails {
  orderId: string;
  customerName: string;
  phoneNumber: string;
  platform: string;
  orderType: string;
  orderStatus: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";
  createdTime: string;
  completedTime: string;
  assignedStaff: string;
  specialInstructions: string;
  receiptNumber: string;
  paymentMethod: string;
  paymentStatus: "Paid" | "Unpaid" | "Pending";
  deliveryAddress: string;
  deliveryDriver: string;
  subtotal: number;
  gstAmount: number;
  discountAmount: number;
  grandTotal: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    gstPercent: number;
    total: number;
  }>;
  timeline: Array<{
    status: string;
    time: string;
    description: string;
    completed: boolean;
  }>;
}

const mockOrdersDatabase: Record<string, PlatformOrderDetails> = {
  "ORD-9001": {
    orderId: "ORD-9001",
    customerName: "Ananya Roy",
    phoneNumber: "+91 98765 43210",
    platform: "Swiggy",
    orderType: "Delivery",
    orderStatus: "Preparing",
    createdTime: "01:15 PM",
    completedTime: "Estimated 01:45 PM",
    assignedStaff: "Chef Jon Bell",
    specialInstructions: "Extra spicy schezwan sauce. Please request delivery partner to avoid ringing doorbell.",
    receiptNumber: "REC-SWG-88219",
    paymentMethod: "Swiggy Pay (Online UPI)",
    paymentStatus: "Paid",
    deliveryAddress: "Flat 402, Highrise Apartments, Park Street, Kolkata",
    deliveryDriver: "Rahul Kumar (Swiggy Rider #4829)",
    subtotal: 800.0,
    gstAmount: 90.0,
    discountAmount: 0.0,
    grandTotal: 890.0,
    items: [
      { id: "1", name: "Chili Chicken Dry", quantity: 2, unitPrice: 250.0, gstPercent: 5, total: 500.0 },
      { id: "2", name: "Schezwan Fried Rice", quantity: 2, unitPrice: 150.0, gstPercent: 5, total: 300.0 },
    ],
    timeline: [
      { status: "Order Received", time: "01:15 PM", description: "Order transmitted via Swiggy API", completed: true },
      { status: "Kitchen Acceptance", time: "01:17 PM", description: "KDS accepted ticket automatically", completed: true },
      { status: "Preparing", time: "01:20 PM", description: "Kitchen cooking dishes", completed: true },
      { status: "Dispatch / Out for Delivery", time: "Pending", description: "Waiting for Swiggy rider arrival", completed: false },
      { status: "Completed", time: "Pending", description: "Order delivered to customer", completed: false },
    ],
  },
  "ORD-9002": {
    orderId: "ORD-9002",
    customerName: "Rohan Kapoor",
    phoneNumber: "+91 98123 45678",
    platform: "Zomato",
    orderType: "Delivery",
    orderStatus: "Ready",
    createdTime: "01:20 PM",
    completedTime: "Estimated 01:40 PM",
    assignedStaff: "Avery Lin",
    specialInstructions: "Provide extra mint chutney and onion rings.",
    receiptNumber: "REC-ZOM-99412",
    paymentMethod: "Credit Card (Zomato Online)",
    paymentStatus: "Paid",
    deliveryAddress: "B-12, Green Park Extension, New Delhi",
    deliveryDriver: "Vikram Singh (Zomato Rider #9102)",
    subtotal: 1000.0,
    gstAmount: 120.0,
    discountAmount: 0.0,
    grandTotal: 1120.0,
    items: [
      { id: "1", name: "Tandoori Chicken (Full)", quantity: 1, unitPrice: 440.0, gstPercent: 5, total: 440.0 },
      { id: "2", name: "Butter Naan", quantity: 3, unitPrice: 60.0, gstPercent: 5, total: 180.0 },
      { id: "3", name: "Dal Makhani", quantity: 1, unitPrice: 380.0, gstPercent: 5, total: 380.0 },
    ],
    timeline: [
      { status: "Order Received", time: "01:20 PM", description: "Order placed via Zomato App", completed: true },
      { status: "Kitchen Acceptance", time: "01:21 PM", description: "Chef accepted ticket", completed: true },
      { status: "Preparing", time: "01:25 PM", description: "Tandoor station preparing order", completed: true },
      { status: "Ready for Pickup", time: "01:38 PM", description: "Order packed and placed at pickup counter", completed: true },
      { status: "Out for Delivery", time: "Pending", description: "Zomato rider picked up package", completed: false },
    ],
  },
};

const defaultOrderDetails = (id: string): PlatformOrderDetails => ({
  orderId: id,
  customerName: "Rahul Sharma",
  phoneNumber: "+91 99887 76655",
  platform: "Walk-in",
  orderType: "Dine-in",
  orderStatus: "Completed",
  createdTime: "12:45 PM",
  completedTime: "01:15 PM",
  assignedStaff: "Maya Patel",
  specialInstructions: "Table #4 service. Customer requested less butter in Dal Makhani.",
  receiptNumber: "REC-POS-10492",
  paymentMethod: "UPI / PhonePe",
  paymentStatus: "Paid",
  deliveryAddress: "Dine-in Table #4 (Main Dining Room)",
  deliveryDriver: "N/A (In-house Server: Maya Patel)",
  subtotal: 1100.0,
  gstAmount: 140.0,
  discountAmount: 0.0,
  grandTotal: 1240.0,
  items: [
    { id: "1", name: "Butter Chicken", quantity: 2, unitPrice: 400.0, gstPercent: 5, total: 800.0 },
    { id: "2", name: "Butter Naan", quantity: 4, unitPrice: 50.0, gstPercent: 5, total: 200.0 },
    { id: "3", name: "Dal Makhani", quantity: 1, unitPrice: 240.0, gstPercent: 5, total: 240.0 },
  ],
  timeline: [
    { status: "Order Placed", time: "12:45 PM", description: "Ticket created by Server Maya", completed: true },
    { status: "Sent to Kitchen", time: "12:46 PM", description: "KDS ticket printed", completed: true },
    { status: "Prepared", time: "01:02 PM", description: "Food served to Table #4", completed: true },
    { status: "Completed & Paid", time: "01:15 PM", description: "Bill paid via PhonePe UPI", completed: true },
  ],
});

export default function PlatformOrderDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const slug = resolvedParams.slug || "restaurant";
  const orderId = resolvedParams.orderId || "ORD-9001";

  const orderData = mockOrdersDatabase[orderId] || defaultOrderDetails(orderId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="space-y-1">
          <Link
            href={`/dashboard/${slug}/platform`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Platform</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Order Details — {orderData.orderId}
            </h1>
            <StatusBadge status={orderData.orderStatus} />
          </div>
          <p className="text-xs text-slate-500 font-mono">
            Receipt: {orderData.receiptNumber} • Channel: {orderData.platform}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print KDS Ticket</span>
          </Button>
          <Button
            size="sm"
            onClick={() => alert(`Receipt #${orderData.receiptNumber} sent to print queue!`)}
            className="flex items-center gap-2 text-xs font-semibold bg-[#0052ff] hover:bg-[#0046dc] text-white shadow-sm border-none cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Print Tax Receipt</span>
          </Button>
        </div>
      </div>

      {/* Top 4 Quick Information Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="design-surface p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase block">Customer</span>
            <span className="text-sm font-bold text-slate-900 block">{orderData.customerName}</span>
            <span className="text-[11px] text-slate-500">{orderData.phoneNumber}</span>
          </div>
        </div>

        <div className="design-surface p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase block">Platform</span>
            <span className="text-sm font-bold text-slate-900 block">{orderData.platform}</span>
            <span className="text-[11px] text-slate-500">{orderData.orderType}</span>
          </div>
        </div>

        <div className="design-surface p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase block">Grand Total</span>
            <span className="text-sm font-bold text-emerald-600 font-mono block">
              ₹{orderData.grandTotal.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-500">{orderData.paymentStatus} via {orderData.paymentMethod}</span>
          </div>
        </div>

        <div className="design-surface p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase block">Created Time</span>
            <span className="text-sm font-bold text-slate-900 font-mono block">{orderData.createdTime}</span>
            <span className="text-[11px] text-slate-500">{orderData.completedTime}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Ordered Items & Order Timeline */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section: Ordered Items */}
          <div className="design-surface p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Ordered Items</h3>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-400">
                {orderData.items.length} Unique Items
              </span>
            </div>

            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ITEM NAME</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-center">QTY</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">UNIT PRICE</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">GST %</TableHead>
                  <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 text-xs">
                {orderData.items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="py-4 px-4 font-semibold text-slate-900">{item.name}</TableCell>
                    <TableCell className="py-4 px-4 text-center font-mono font-bold text-blue-600">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right font-mono text-slate-700">
                      ₹{item.unitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right font-mono text-slate-500">
                      {item.gstPercent}%
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{item.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs font-medium max-w-xs ml-auto">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold text-slate-900">₹{orderData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (5%):</span>
                <span className="font-mono font-semibold text-slate-900">₹{orderData.gstAmount.toFixed(2)}</span>
              </div>
              {orderData.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-mono font-semibold">-₹{orderData.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="font-mono text-blue-600 text-base">₹{orderData.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Section: Order Timeline */}
          <div className="design-surface p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-4 h-4 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900">Order Timeline</h3>
            </div>

            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
              {orderData.timeline.map((step, idx) => (
                <div key={idx} className="relative">
                  <div
                    className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white ${
                      step.completed
                        ? "border-emerald-500 text-emerald-500"
                        : "border-slate-300 text-slate-300"
                    }`}
                  >
                    {step.completed && <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white" />}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${step.completed ? "text-slate-900" : "text-slate-400"}`}>
                        {step.status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">{step.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Information Sections */}
        <div className="space-y-6">
          {/* Section: Order Information */}
          <div className="design-surface p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Order Information</h3>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono font-bold text-slate-900">{orderData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Type:</span>
                <span className="font-semibold text-slate-800">{orderData.orderType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Status:</span>
                <StatusBadge status={orderData.orderStatus} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created Time:</span>
                <span className="font-mono text-slate-700">{orderData.createdTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Completed Time:</span>
                <span className="font-mono text-slate-700">{orderData.completedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt Number:</span>
                <span className="font-mono font-semibold text-blue-600">{orderData.receiptNumber}</span>
              </div>
            </div>
          </div>

          {/* Section: Customer & Platform Information */}
          <div className="design-surface p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Customer & Platform</h3>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-semibold text-slate-900">{orderData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone Number:</span>
                <span className="font-mono text-slate-800">{orderData.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ordering Platform:</span>
                <span className="font-semibold text-blue-600">{orderData.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Staff:</span>
                <span className="font-semibold text-slate-800">{orderData.assignedStaff}</span>
              </div>
            </div>
          </div>

          {/* Section: Special Instructions */}
          <div className="design-surface p-6 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <ChefHat className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Special Instructions</h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/60 border border-amber-200/60 p-3 rounded-xl font-medium">
              {orderData.specialInstructions || "No special requests."}
            </p>
          </div>

          {/* Section: Payment & Delivery Details */}
          <div className="design-surface p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bike className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Payment & Delivery Details</h3>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-medium text-slate-800">{orderData.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <StatusBadge status={orderData.paymentStatus} />
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 block mb-1">Delivery Address:</span>
                <span className="font-medium text-slate-800 leading-relaxed block">{orderData.deliveryAddress}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Rider / Delivery Staff:</span>
                <span className="font-semibold text-slate-900">{orderData.deliveryDriver}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
