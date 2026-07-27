"use client";

import React, { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Plus, ChevronRight, Users, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StaffMember {
  id: string;
  initials: string;
  name: string;
  role: string;
  department: string;
  attendance: "Present" | "Absent" | "Leave";
}

export interface SalaryRecord {
  id: string;
  name: string;
  role: string;
  monthlySalary: number;
  advancePaid: number;
  remainingSalary: number;
  lastPaidDate: string;
  paymentStatus: "Paid" | "Pending";
}

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState<"attendance" | "salary">("attendance");
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Team members directory focused on details and attendance
  const teamMembers: StaffMember[] = [
    {
      id: "ST-1",
      initials: "AL",
      name: "Avery Lin",
      role: "General Manager",
      department: "Operations",
      attendance: "Present",
    },
    {
      id: "ST-2",
      initials: "MP",
      name: "Maya Patel",
      role: "Floor Lead",
      department: "Front of house",
      attendance: "Present",
    },
    {
      id: "ST-3",
      initials: "JB",
      name: "Jon Bell",
      role: "Sous Chef",
      department: "Kitchen",
      attendance: "Present",
    },
    {
      id: "ST-4",
      initials: "SM",
      name: "Sophie Martin",
      role: "Server",
      department: "Front of house",
      attendance: "Leave",
    },
    {
      id: "ST-5",
      initials: "HT",
      name: "Hiro Tanaka",
      role: "Line Cook",
      department: "Kitchen",
      attendance: "Absent",
    },
  ];

  // Read-only Salary Management data (INR ₹)
  const salaryRecords: SalaryRecord[] = [
    {
      id: "SAL-1",
      name: "Avery Lin",
      role: "General Manager",
      monthlySalary: 85000,
      advancePaid: 10000,
      remainingSalary: 75000,
      lastPaidDate: "2026-07-01",
      paymentStatus: "Paid",
    },
    {
      id: "SAL-2",
      name: "Maya Patel",
      role: "Floor Lead",
      monthlySalary: 55000,
      advancePaid: 5000,
      remainingSalary: 50000,
      lastPaidDate: "2026-07-01",
      paymentStatus: "Paid",
    },
    {
      id: "SAL-3",
      name: "Jon Bell",
      role: "Sous Chef",
      monthlySalary: 62000,
      advancePaid: 0,
      remainingSalary: 62000,
      lastPaidDate: "2026-07-01",
      paymentStatus: "Paid",
    },
    {
      id: "SAL-4",
      name: "Sophie Martin",
      role: "Server",
      monthlySalary: 35000,
      advancePaid: 4000,
      remainingSalary: 31000,
      lastPaidDate: "2026-06-30",
      paymentStatus: "Pending",
    },
    {
      id: "SAL-5",
      name: "Hiro Tanaka",
      role: "Line Cook",
      monthlySalary: 40000,
      advancePaid: 8000,
      remainingSalary: 32000,
      lastPaidDate: "2026-07-01",
      paymentStatus: "Paid",
    },
  ];

  const getAttendanceBadgeStyles = (status: "Present" | "Absent" | "Leave") => {
    switch (status) {
      case "Present":
        return "bg-emerald-50 text-emerald-600 border-emerald-200/60 font-semibold";
      case "Absent":
        return "bg-rose-50 text-rose-600 border-rose-200/60 font-semibold";
      case "Leave":
        return "bg-amber-50 text-amber-600 border-amber-200/60 font-semibold";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">PEOPLE & PAYROLL</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Staff
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Keep your team aligned, scheduled, and supported.
          </p>
        </div>

        <Button
          onClick={() => setIsAddStaffOpen(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start md:self-auto cursor-pointer h-auto border-none"
        >
          <Plus className="w-4 h-4" />
          <span>Add team member</span>
        </Button>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="TEAM MEMBERS"
          value="24"
          subtext="↗ 2 new this month"
        />
        <StatCard
          label="WORKING TODAY"
          value="14"
          subtext="↗ 58% of team"
        />
        <StatCard
          label="TOTAL PAYROLL"
          value="₹2,77,000"
          subtext="↗ Monthly budget"
        />
      </div>

      {/* Tab Selectors: People & Attendance | Salary */}
      <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("attendance")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0",
            activeTab === "attendance"
              ? "bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs"
              : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <Users className="w-4 h-4" />
          <span>People & Attendance</span>
        </button>

        <button
          onClick={() => setActiveTab("salary")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0",
            activeTab === "salary"
              ? "bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs"
              : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <CreditCard className="w-4 h-4" />
          <span>Salary</span>
        </button>
      </div>

      {/* Tab 1: People & Attendance Directory */}
      {activeTab === "attendance" && (
        <div className="design-surface p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                THE LANGHAM TEAM
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                People directory & attendance
              </h3>
            </div>

            <button
              onClick={() => setIsScheduleOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View schedule</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Data Table with Read-only Attendance Status */}
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">TEAM MEMBER</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ROLE</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">DEPARTMENT</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ATTENDANCE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {teamMembers.map((member) => (
                <TableRow
                  key={member.id}
                  className="hover:bg-slate-50/80 transition-colors border-slate-100 group"
                >
                  <TableCell className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200/60">
                        {member.initials}
                      </div>
                      <span className="font-semibold text-slate-900">
                        {member.name}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-4 text-slate-600 font-medium">
                    {member.role}
                  </TableCell>

                  <TableCell className="py-4 px-4 text-slate-500">
                    {member.department}
                  </TableCell>

                  {/* Read-only Attendance Badge */}
                  <TableCell className="py-4 px-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border select-none",
                        getAttendanceBadgeStyles(member.attendance)
                      )}
                    >
                      {member.attendance}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Tab 2: Read-Only Salary Management */}
      {activeTab === "salary" && (
        <div className="design-surface p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="text-[10px] font-mono font-semibold tracking-wider text-blue-600 uppercase">
                SALARY & DISBURSEMENTS
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                Salary Management (Read-Only)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono bg-slate-100 px-3 py-1.5 rounded-lg self-start sm:self-auto">
              Amounts in ₹ (INR)
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STAFF NAME</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ROLE</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">MONTHLY SALARY (₹)</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ADVANCE PAID (₹)</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">REMAINING SALARY (₹)</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">LAST PAID DATE</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">PAYMENT STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {salaryRecords.map((record) => (
                <TableRow
                  key={record.id}
                  className="hover:bg-slate-50/80 transition-colors border-slate-100"
                >
                  <TableCell className="py-4 px-4 font-semibold text-slate-900">
                    {record.name}
                  </TableCell>

                  <TableCell className="py-4 px-4 text-slate-600 font-medium">
                    {record.role}
                  </TableCell>

                  <TableCell className="py-4 px-4 text-right font-mono font-semibold text-slate-900">
                    ₹{record.monthlySalary.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-4 px-4 text-right font-mono text-amber-600">
                    ₹{record.advancePaid.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-4 px-4 text-right font-mono font-bold text-blue-600">
                    ₹{record.remainingSalary.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-4 px-4 font-mono text-slate-500">
                    {record.lastPaidDate}
                  </TableCell>

                  <TableCell className="py-4 px-4">
                    <StatusBadge status={record.paymentStatus} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal: Add Team Member */}
      <Modal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        title="Add Team Member"
        subtitle="Invite a new staff member to your workspace."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Maya Patel"
              className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-sm focus-visible:ring-2 focus-visible:ring-blue-600/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role
              </label>
              <Input
                type="text"
                placeholder="e.g. Head Sommelier"
                className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-sm focus-visible:ring-2 focus-visible:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <select className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-transparent">
                <option value="Front of house">Front of house</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Operations">Operations</option>
                <option value="Beverage">Beverage</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setIsAddStaffOpen(false)}
              className="px-4 py-2 h-9 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                alert("Team member invited!");
                setIsAddStaffOpen(false);
              }}
              className="px-5 py-2 h-9 rounded-xl bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-sm border-none"
            >
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Shift Schedule View */}
      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Weekly Shift Roster"
        subtitle="Manage upcoming shift schedules and assignments."
        className="max-w-xl"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            {[
              { day: "Thursday (Today)", shift: "Lunch Peak", staff: "Avery, Maya, Jon (3 on floor)" },
              { day: "Friday", shift: "Dinner Service", staff: "Avery, Sophie, Hiro, Jon (4 on floor)" },
              { day: "Saturday", shift: "All Day", staff: "Full Team Roster (14 active)" },
            ].map((s, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{s.day}</div>
                  <div className="text-slate-500">{s.shift}</div>
                </div>
                <div className="text-blue-600 font-semibold">{s.staff}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setIsScheduleOpen(false)}
              className="px-4 py-2 h-9 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl border-none"
            >
              Close Schedule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

