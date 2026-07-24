"use client";

import React, { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Modal } from "@/components/ui/modal";
import { Plus, ChevronRight, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StaffPage() {
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Team members with read-only attendance status
  const teamMembers = [
    {
      initials: "AL",
      name: "Avery Lin",
      role: "General Manager",
      department: "Operations",
      shiftStatus: "On shift",
      attendance: "Present" as const,
    },
    {
      initials: "MP",
      name: "Maya Patel",
      role: "Floor Lead",
      department: "Front of house",
      shiftStatus: "On shift",
      attendance: "Present" as const,
    },
    {
      initials: "JB",
      name: "Jon Bell",
      role: "Sous Chef",
      department: "Kitchen",
      shiftStatus: "On break",
      attendance: "Present" as const,
    },
    {
      initials: "SM",
      name: "Sophie Martin",
      role: "Server",
      department: "Front of house",
      shiftStatus: "Scheduled",
      attendance: "Leave" as const,
    },
    {
      initials: "HT",
      name: "Hiro Tanaka",
      role: "Line Cook",
      department: "Kitchen",
      shiftStatus: "Off Duty",
      attendance: "Absent" as const,
    },
  ];

  const getAttendanceBadgeStyles = (status: "Present" | "Absent" | "Leave") => {
    switch (status) {
      case "Present":
        return "bg-emerald-50 text-emerald-600 border-emerald-200/60";
      case "Absent":
        return "bg-rose-50 text-rose-600 border-rose-200/60";
      case "Leave":
        return "bg-amber-50 text-amber-600 border-amber-200/60";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">PEOPLE & SHIFTS</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Staff
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Keep your team aligned, scheduled, and supported.
          </p>
        </div>

        <button
          onClick={() => setIsAddStaffOpen(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add team member</span>
        </button>
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
          label="LABOUR COST"
          value="22.8%"
          subtext="↗ On target"
        />
      </div>

      {/* People Directory Table Card */}
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                <th className="py-3 px-4">TEAM MEMBER</th>
                <th className="py-3 px-4">ROLE</th>
                <th className="py-3 px-4">DEPARTMENT</th>
                <th className="py-3 px-4">SHIFT STATUS</th>
                <th className="py-3 px-4">ATTENDANCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {teamMembers.map((member, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200/60">
                        {member.initials}
                      </div>
                      <span className="font-semibold text-slate-900">
                        {member.name}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-slate-600 font-medium">
                    {member.role}
                  </td>

                  <td className="py-4 px-4 text-slate-500">
                    {member.department}
                  </td>

                  <td className="py-4 px-4 text-slate-500 font-mono">
                    {member.shiftStatus}
                  </td>

                  {/* Read-only Attendance Badge */}
                  <td className="py-4 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border select-none",
                        getAttendanceBadgeStyles(member.attendance)
                      )}
                    >
                      {member.attendance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
            <input
              type="text"
              placeholder="e.g. Maya Patel"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role
              </label>
              <input
                type="text"
                placeholder="e.g. Head Sommelier"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <select className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20">
                <option value="Front of house">Front of house</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Operations">Operations</option>
                <option value="Beverage">Beverage</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              onClick={() => setIsAddStaffOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert("Team member invited!");
                setIsAddStaffOpen(false);
              }}
              className="px-5 py-2 rounded-xl bg-[#0052ff] text-white text-xs font-semibold shadow-sm"
            >
              Send Invite
            </button>
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
            <button
              onClick={() => setIsScheduleOpen(false)}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
            >
              Close Schedule
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
