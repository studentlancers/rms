"use client";

import React, { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  User,
  Briefcase,
  CalendarCheck,
  CreditCard,
  Award,
  Activity,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";

interface StaffDetails {
  employeeId: string;
  initials: string;
  fullName: string;
  role: string;
  department: string;
  attendanceStatus: "Present" | "Absent" | "Leave";
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  joiningDate: string;
  employmentStatus: string;
  shift: string;
  workingHours: string;
  manager: string;
  attendanceSummary: {
    presentDays: number;
    absentDays: number;
    lateEntries: number;
    totalWorkingHours: number;
    overtimeHours: number;
  };
  salaryInformation: {
    monthlySalary: number;
    bonus: number;
    lastSalaryDate: string;
  };
  performanceSummary: {
    ordersServed: number;
    tablesManaged: number;
    customerRating: number;
    completedShifts: number;
  };
  recentOrders: Array<{
    id: string;
    tableOrPlatform: string;
    amount: number;
    status: string;
    time: string;
  }>;
  recentAttendance: Array<{
    date: string;
    checkIn: string;
    checkOut: string;
    status: "Present" | "Absent" | "Late";
  }>;
  recentLogins: Array<{
    device: string;
    ip: string;
    time: string;
  }>;
}

const mockStaffDatabase: Record<string, StaffDetails> = {
  "ST-1": {
    employeeId: "ST-1",
    initials: "AL",
    fullName: "Avery Lin",
    role: "General Manager",
    department: "Operations",
    attendanceStatus: "Present",
    phone: "+91 98200 11223",
    email: "avery.lin@restaurant.com",
    address: "Suite 4B, Grand Promenade, Sector 15, Gurgaon",
    emergencyContact: "Elena Lin (Spouse) — +91 98200 99887",
    joiningDate: "15 Jan 2022",
    employmentStatus: "Full-Time Permanent",
    shift: "Morning & Afternoon Shift (09:00 AM - 06:00 PM)",
    workingHours: "45 hrs / week",
    manager: "Executive Board",
    attendanceSummary: {
      presentDays: 24,
      absentDays: 1,
      lateEntries: 0,
      totalWorkingHours: 192,
      overtimeHours: 12,
    },
    salaryInformation: {
      monthlySalary: 85000,
      bonus: 10000,
      lastSalaryDate: "2026-07-01",
    },
    performanceSummary: {
      ordersServed: 420,
      tablesManaged: 180,
      customerRating: 4.9,
      completedShifts: 156,
    },
    recentOrders: [
      { id: "ORD-9003", tableOrPlatform: "Table #4 (Walk-in)", amount: 1240.0, status: "Completed", time: "12:45 PM" },
      { id: "ORD-9001", tableOrPlatform: "Swiggy Delivery", amount: 890.0, status: "Preparing", time: "01:15 PM" },
      { id: "ORD-8994", tableOrPlatform: "Table #2 (Walk-in)", amount: 2150.0, status: "Completed", time: "Yesterday" },
    ],
    recentAttendance: [
      { date: "01 Aug 2026", checkIn: "08:52 AM", checkOut: "On Shift", status: "Present" },
      { date: "31 Jul 2026", checkIn: "08:55 AM", checkOut: "06:15 PM", status: "Present" },
      { date: "30 Jul 2026", checkIn: "08:48 AM", checkOut: "06:30 PM", status: "Present" },
    ],
    recentLogins: [
      { device: "Chrome POS Terminal #1", ip: "192.168.1.45", time: "Today, 08:53 AM" },
      { device: "iOS Owner App (iPad Pro)", ip: "192.168.1.88", time: "Today, 11:20 AM" },
    ],
  },
  "ST-2": {
    employeeId: "ST-2",
    initials: "MP",
    fullName: "Maya Patel",
    role: "Floor Lead",
    department: "Front of house",
    attendanceStatus: "Present",
    phone: "+91 97112 33445",
    email: "maya.patel@restaurant.com",
    address: "74-A Cyber City Enclave, Sector 24, Gurgaon",
    emergencyContact: "Rajesh Patel (Father) — +91 97112 00011",
    joiningDate: "10 Aug 2023",
    employmentStatus: "Full-Time",
    shift: "Evening Shift (01:00 PM - 10:00 PM)",
    workingHours: "40 hrs / week",
    manager: "Avery Lin (General Manager)",
    attendanceSummary: {
      presentDays: 25,
      absentDays: 0,
      lateEntries: 1,
      totalWorkingHours: 176,
      overtimeHours: 8,
    },
    salaryInformation: {
      monthlySalary: 55000,
      bonus: 5000,
      lastSalaryDate: "2026-07-01",
    },
    performanceSummary: {
      ordersServed: 310,
      tablesManaged: 145,
      customerRating: 4.8,
      completedShifts: 130,
    },
    recentOrders: [
      { id: "ORD-9005", tableOrPlatform: "Takeaway", amount: 540.0, status: "Ready", time: "12:50 PM" },
      { id: "ORD-9002", tableOrPlatform: "Zomato Delivery", amount: 1120.0, status: "Ready", time: "01:20 PM" },
    ],
    recentAttendance: [
      { date: "01 Aug 2026", checkIn: "12:58 PM", checkOut: "On Shift", status: "Present" },
      { date: "31 Jul 2026", checkIn: "01:05 PM", checkOut: "10:10 PM", status: "Late" },
    ],
    recentLogins: [
      { device: "Android POS Handheld #3", ip: "192.168.1.102", time: "Today, 12:59 PM" },
    ],
  },
};

const defaultStaffDetails = (id: string): StaffDetails => ({
  employeeId: id,
  initials: "JB",
  fullName: "Jon Bell",
  role: "Sous Chef",
  department: "Kitchen",
  attendanceStatus: "Present",
  phone: "+91 99000 88776",
  email: "jon.bell@restaurant.com",
  address: "Block C, Green Park, South Delhi",
  emergencyContact: "Sarah Bell (Sister) — +91 99000 11223",
  joiningDate: "01 Mar 2023",
  employmentStatus: "Full-Time Permanent",
  shift: "Kitchen Shift (10:00 AM - 08:00 PM)",
  workingHours: "48 hrs / week",
  manager: "Avery Lin",
  attendanceSummary: {
    presentDays: 23,
    absentDays: 2,
    lateEntries: 1,
    totalWorkingHours: 184,
    overtimeHours: 15,
  },
  salaryInformation: {
    monthlySalary: 62000,
    bonus: 6000,
    lastSalaryDate: "2026-07-01",
  },
  performanceSummary: {
    ordersServed: 540,
    tablesManaged: 0,
    customerRating: 4.9,
    completedShifts: 142,
  },
  recentOrders: [
    { id: "ORD-9001", tableOrPlatform: "Swiggy Delivery", amount: 890.0, status: "Preparing", time: "01:15 PM" },
    { id: "ORD-9002", tableOrPlatform: "Zomato Delivery", amount: 1120.0, status: "Ready", time: "01:20 PM" },
  ],
  recentAttendance: [
    { date: "01 Aug 2026", checkIn: "09:55 AM", checkOut: "On Shift", status: "Present" },
    { date: "31 Jul 2026", checkIn: "10:00 AM", checkOut: "08:15 PM", status: "Present" },
  ],
  recentLogins: [
    { device: "Kitchen Display System (KDS Terminal #1)", ip: "192.168.1.50", time: "Today, 09:56 AM" },
  ],
});

export default function StaffDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; staffId: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug || "restaurant";
  const staffId = resolvedParams.staffId || "ST-1";

  const staff = mockStaffDatabase[staffId] || defaultStaffDetails(staffId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="space-y-1">
          <Link
            href={`/dashboard/${slug}/staff`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Staff Directory</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Staff Details — {staff.fullName}
            </h1>
            <Badge
              variant="outline"
              className={
                staff.attendanceStatus === "Present"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200 font-semibold"
                  : staff.attendanceStatus === "Absent"
                  ? "bg-rose-50 text-rose-600 border-rose-200 font-semibold"
                  : "bg-amber-50 text-amber-600 border-amber-200 font-semibold"
              }
            >
              {staff.attendanceStatus} Today
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            Employee ID: {staff.employeeId} • {staff.role} ({staff.department})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`Sent quick message to ${staff.fullName} (${staff.phone})`)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <Phone className="w-4 h-4 text-slate-500" />
            <span>Contact Staff</span>
          </Button>
        </div>
      </div>

      {/* Hero Card with Profile Avatar & Core Stats */}
      <div className="design-surface p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            {staff.initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{staff.fullName}</h2>
            <p className="text-xs font-medium text-blue-600 mt-0.5">{staff.role} — {staff.department}</p>
            <p className="text-xs text-slate-500 mt-1">Joined {staff.joiningDate} • {staff.employmentStatus}</p>
          </div>
        </div>

        {/* Quick Stat Pill Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
            <span className="text-[10px] font-mono font-semibold text-slate-400 block uppercase">Rating</span>
            <span className="text-sm font-bold text-slate-900">⭐ {staff.performanceSummary.customerRating} / 5</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
            <span className="text-[10px] font-mono font-semibold text-slate-400 block uppercase">Shifts</span>
            <span className="text-sm font-bold text-slate-900">{staff.performanceSummary.completedShifts} Done</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
            <span className="text-[10px] font-mono font-semibold text-slate-400 block uppercase">Salary</span>
            <span className="text-sm font-bold text-emerald-600 font-mono">₹{staff.salaryInformation.monthlySalary.toLocaleString("en-IN")}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
            <span className="text-[10px] font-mono font-semibold text-slate-400 block uppercase">Present</span>
            <span className="text-sm font-bold text-blue-600 font-mono">{staff.attendanceSummary.presentDays} Days</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans): Personal, Employment, Attendance & Salary */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Personal Information */}
          <div className="design-surface p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Employee ID</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{staff.employeeId}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Full Name</span>
                <span className="font-semibold text-slate-900">{staff.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Role</span>
                <span className="font-medium text-slate-800">{staff.role}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Department</span>
                <span className="font-medium text-slate-800">{staff.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <div>
                  <span className="text-slate-400 block font-mono text-[10px] uppercase">Phone</span>
                  <span className="font-mono text-slate-900">{staff.phone}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <div>
                  <span className="text-slate-400 block font-mono text-[10px] uppercase">Email Address</span>
                  <span className="font-mono text-slate-900">{staff.email}</span>
                </div>
              </div>
              <div className="sm:col-span-2 flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400 block font-mono text-[10px] uppercase">Residential Address</span>
                  <span className="text-slate-800 leading-relaxed">{staff.address}</span>
                </div>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Emergency Contact</span>
                <span className="font-semibold text-rose-600">{staff.emergencyContact}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Employment Information */}
          <div className="design-surface p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Employment Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Joining Date</span>
                <span className="font-semibold text-slate-900 font-mono">{staff.joiningDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Employment Status</span>
                <span className="font-semibold text-emerald-600">{staff.employmentStatus}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Assigned Shift</span>
                <span className="font-medium text-slate-800">{staff.shift}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Weekly Working Hours</span>
                <span className="font-medium text-slate-800">{staff.workingHours}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Direct Manager / Supervisor</span>
                <span className="font-semibold text-slate-900">{staff.manager}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Attendance Summary */}
          <div className="design-surface p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Attendance Summary (This Month)</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Monthly Cycle</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-center">
                <span className="text-[10px] font-mono font-semibold text-emerald-700 block uppercase">Present</span>
                <span className="text-lg font-bold text-emerald-700 font-mono">{staff.attendanceSummary.presentDays} Days</span>
              </div>
              <div className="p-3 bg-rose-50/70 border border-rose-200/60 rounded-xl text-center">
                <span className="text-[10px] font-mono font-semibold text-rose-700 block uppercase">Absent</span>
                <span className="text-lg font-bold text-rose-700 font-mono">{staff.attendanceSummary.absentDays} Days</span>
              </div>
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-center">
                <span className="text-[10px] font-mono font-semibold text-amber-700 block uppercase">Late Entries</span>
                <span className="text-lg font-bold text-amber-700 font-mono">{staff.attendanceSummary.lateEntries} Times</span>
              </div>
              <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-center">
                <span className="text-[10px] font-mono font-semibold text-blue-700 block uppercase">Total Hours</span>
                <span className="text-lg font-bold text-blue-700 font-mono">{staff.attendanceSummary.totalWorkingHours} hrs</span>
              </div>
              <div className="p-3 bg-purple-50/70 border border-purple-200/60 rounded-xl text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono font-semibold text-purple-700 block uppercase">Overtime</span>
                <span className="text-lg font-bold text-purple-700 font-mono">{staff.attendanceSummary.overtimeHours} hrs</span>
              </div>
            </div>

            {/* Recent Attendance Log Table */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-800 block mb-2">Recent Attendance Log</span>
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                    <TableHead className="py-2 px-3 h-auto">DATE</TableHead>
                    <TableHead className="py-2 px-3 h-auto">CHECK IN</TableHead>
                    <TableHead className="py-2 px-3 h-auto">CHECK OUT</TableHead>
                    <TableHead className="py-2 px-3 h-auto text-right">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 text-xs font-mono">
                  {staff.recentAttendance.map((log, i) => (
                    <TableRow key={i}>
                      <TableCell className="py-2.5 px-3 font-semibold text-slate-900">{log.date}</TableCell>
                      <TableCell className="py-2.5 px-3 text-slate-600">{log.checkIn}</TableCell>
                      <TableCell className="py-2.5 px-3 text-slate-600">{log.checkOut}</TableCell>
                      <TableCell className="py-2.5 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === "Present"
                              ? "bg-emerald-50 text-emerald-600"
                              : log.status === "Late"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {log.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Section 4: Salary Information */}
          <div className="design-surface p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Salary & Disbursement Details</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Read-Only</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Base Monthly Salary</span>
                <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">
                  ₹{staff.salaryInformation.monthlySalary.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Performance Bonus</span>
                <span className="text-xl font-bold text-emerald-600 font-mono mt-1 block">
                  +₹{staff.salaryInformation.bonus.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Last Disbursement Date</span>
                <span className="text-sm font-bold text-blue-600 font-mono mt-2 block">
                  {staff.salaryInformation.lastSalaryDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Performance & Recent Activity */}
        <div className="space-y-8">
          {/* Section 5: Performance Summary */}
          <div className="design-surface p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-4 h-4 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">Performance Summary</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-600 font-medium">Orders Served / Handled</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{staff.performanceSummary.ordersServed} Orders</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-600 font-medium">Tables Managed</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{staff.performanceSummary.tablesManaged} Tables</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-600 font-medium">Customer Rating</span>
                <span className="font-mono font-bold text-amber-600 text-sm">⭐ {staff.performanceSummary.customerRating} / 5.0</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-600 font-medium">Completed Shifts</span>
                <span className="font-mono font-bold text-blue-600 text-sm">{staff.performanceSummary.completedShifts} Shifts</span>
              </div>
            </div>
          </div>

          {/* Section 6: Recent Activity (Orders & Logins) */}
          <div className="design-surface p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Recent Orders Handled</span>
              <div className="space-y-2">
                {staff.recentOrders.map((ord) => (
                  <div key={ord.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900 font-mono">{ord.id}</div>
                      <div className="text-[11px] text-slate-500">{ord.tableOrPlatform}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-blue-600">₹{ord.amount.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">{ord.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              <span className="text-xs font-bold text-slate-800 block pt-3 border-t border-slate-100">System Logins</span>
              <div className="space-y-2 text-xs font-mono">
                {staff.recentLogins.map((login, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px]">
                    <div className="font-semibold text-slate-800">{login.device}</div>
                    <div className="text-slate-500 flex justify-between mt-0.5">
                      <span>IP: {login.ip}</span>
                      <span>{login.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
