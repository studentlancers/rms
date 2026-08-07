"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  ChevronRight,
  Users,
  CreditCard,
  Eye,
  Mail,
  Loader2,
  MoreVertical,
  UserCheck,
  Shield,
  Trash2,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  listStaff,
  listPendingInvitations,
  inviteStaff,
  updateStaffRole,
  removeStaff,
  cancelInvitation,
} from "@/actions/staff";

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
  const router = useRouter();
  const params = useParams();
  const slug = (params?.slug as string) || "restaurant";

  const [activeTab, setActiveTab] = useState<"attendance" | "invitations" | "salary">("attendance");
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Dynamic Data States
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "staff">("staff");

  // Load members and invitations from Better Auth
  const loadStaffData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [staffRes, invRes] = await Promise.allSettled([
        listStaff(),
        listPendingInvitations(),
      ]);

      const rawStaff: any = staffRes.status === "fulfilled" ? staffRes.value : null;
      const fetchedMembers = Array.isArray(rawStaff) ? rawStaff : (rawStaff?.members || []);
      const fetchedInvitations = invRes.status === "fulfilled" ? invRes.value : [];

      setMembers(fetchedMembers || []);
      setInvitations(fetchedInvitations || []);
    } catch (err: any) {
      console.error("Error loading staff roster:", err);
      if (!silent) toast.error(err.message || "Failed to load staff roster");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();

    // 5-second polling interval for roster synchronization
    const interval = setInterval(() => {
      loadStaffData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Submit Invite Staff Form
  const handleInviteStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("email", inviteEmail);
      formData.append("role", inviteRole);

      await inviteStaff(formData);
      toast.success(`Invitation sent to ${inviteEmail}!`);

      setIsAddStaffOpen(false);
      setInviteEmail("");
      setInviteRole("staff");
      await loadStaffData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Member Role
  const handleUpdateRole = async (memberId: string, newRole: "admin" | "staff") => {
    try {
      await updateStaffRole(memberId, newRole);
      toast.success(`Role updated to ${newRole}`);
      await loadStaffData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update member role");
    }
  };

  // Remove Staff Member
  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the restaurant roster?`)) return;

    try {
      await removeStaff(memberId);
      toast.success(`${name} removed from restaurant`);
      await loadStaffData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove staff member");
    }
  };

  // Cancel Invitation
  const handleCancelInvitation = async (invitationId: string, email: string) => {
    try {
      await cancelInvitation(invitationId);
      toast.success(`Invitation for ${email} cancelled`);
      await loadStaffData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel invitation");
    }
  };

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
  ];

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
          <span>Invite team member</span>
        </Button>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="ACTIVE MEMBERS"
          value={isLoading ? "..." : `${members.length} Members`}
          subtext="active organization roster"
        />
        <StatCard
          label="PENDING INVITATIONS"
          value={isLoading ? "..." : `${invitations.length} Pending`}
          subtext="email invites sent"
        />
        <StatCard
          label="TOTAL PAYROLL"
          value="₹2,77,000"
          subtext="monthly budget"
        />
      </div>

      {/* Tab Selectors: People Roster | Pending Invites | Salary */}
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
          <span>Active Roster ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("invitations")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0",
            activeTab === "invitations"
              ? "bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs"
              : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <Mail className="w-4 h-4" />
          <span>Pending Invitations ({invitations.length})</span>
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
          <span>Salary (Read-Only)</span>
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="design-surface p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Loading organization roster from Better Auth...</span>
        </div>
      )}

      {/* Tab 1: Active Roster */}
      {!isLoading && activeTab === "attendance" && (
        <div className="design-surface p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                ACTIVE RESTAURANT ROSTER
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                Organization Members
              </h3>
            </div>

            <button
              onClick={() => setIsScheduleOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View shift roster</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">TEAM MEMBER</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">EMAIL ADDRESS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ORGANIZATION ROLE</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">JOINED DATE</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                    No active members found.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => {
                  const userName = member.user?.name || "Staff Member";
                  const userEmail = member.user?.email || "N/A";
                  const initials = userName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();
                  const joinedDate = new Date(member.createdAt).toLocaleDateString();

                  return (
                    <TableRow key={member.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200/60">
                            {initials}
                          </div>
                          <span className="font-semibold text-slate-900">{userName}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-4 font-mono text-slate-600">
                        {userEmail}
                      </TableCell>

                      <TableCell className="py-4 px-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border uppercase",
                            member.role === "owner"
                              ? "bg-purple-50 text-purple-600 border-purple-200"
                              : member.role === "admin"
                              ? "bg-blue-50 text-blue-600 border-blue-200"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          )}
                        >
                          {member.role}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-4 px-4 font-mono text-slate-500">
                        {joinedDate}
                      </TableCell>

                      <TableCell className="py-4 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase">
                              Member Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {member.role !== "owner" && member.role === "staff" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(member.id, "admin")}
                                className="text-xs gap-2 text-blue-600 font-semibold cursor-pointer"
                              >
                                <Shield className="w-3.5 h-3.5" /> Promote to Admin
                              </DropdownMenuItem>
                            )}

                            {member.role !== "owner" && member.role === "admin" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(member.id, "staff")}
                                className="text-xs gap-2 text-amber-600 font-semibold cursor-pointer"
                              >
                                <Shield className="w-3.5 h-3.5" /> Demote to Staff
                              </DropdownMenuItem>
                            )}

                            {member.role !== "owner" && (
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member.id, userName)}
                                className="text-xs gap-2 text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Remove Member
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Tab 2: Pending Invitations */}
      {!isLoading && activeTab === "invitations" && (
        <div className="design-surface p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] font-mono font-semibold tracking-wider text-blue-600 uppercase">
                PENDING EMAIL INVITATIONS
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                Staff Invitations
              </h3>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">EMAIL ADDRESS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">ASSIGNED ROLE</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">STATUS</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">EXPIRY DATE</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {invitations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                    No pending invitations.
                  </TableCell>
                </TableRow>
              ) : (
                invitations.map((inv) => {
                  const expiryDate = new Date(inv.expiresAt).toLocaleDateString();

                  return (
                    <TableRow key={inv.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                      <TableCell className="py-4 px-4 font-mono font-bold text-slate-900">
                        {inv.email}
                      </TableCell>

                      <TableCell className="py-4 px-4 font-semibold text-blue-600 uppercase">
                        {inv.role || "staff"}
                      </TableCell>

                      <TableCell className="py-4 px-4">
                        <StatusBadge status="Pending" />
                      </TableCell>

                      <TableCell className="py-4 px-4 font-mono text-slate-500">
                        {expiryDate}
                      </TableCell>

                      <TableCell className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelInvitation(inv.id, inv.email)}
                          className="h-8 text-xs text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel Invite
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Tab 3: Read-Only Salary Management */}
      {!isLoading && activeTab === "salary" && (
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
                <TableRow key={record.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                  <TableCell className="py-4 px-4 font-semibold text-slate-900">{record.name}</TableCell>
                  <TableCell className="py-4 px-4 text-slate-600 font-medium">{record.role}</TableCell>
                  <TableCell className="py-4 px-4 text-right font-mono font-semibold text-slate-900">₹{record.monthlySalary.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="py-4 px-4 text-right font-mono text-amber-600">₹{record.advancePaid.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="py-4 px-4 text-right font-mono font-bold text-blue-600">₹{record.remainingSalary.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="py-4 px-4 font-mono text-slate-500">{record.lastPaidDate}</TableCell>
                  <TableCell className="py-4 px-4"><StatusBadge status={record.paymentStatus} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal: Add / Invite Team Member */}
      <Modal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        title="Invite Team Member"
        subtitle="Send an email invitation via Better Auth."
      >
        <form onSubmit={handleInviteStaffSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Staff Email Address *
            </label>
            <Input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="e.g. staff@restaurant.com"
              className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Organization Role *
            </label>
            <select
              value={inviteRole}
              onChange={(e: any) => setInviteRole(e.target.value)}
              className="w-full px-3.5 py-2 h-10 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
            >
              <option value="staff">Staff (Operational POS & Kitchen Access)</option>
              <option value="admin">Admin (Managerial Access)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddStaffOpen(false)}
              className="px-4 py-2 h-9 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !inviteEmail}
              className="px-5 py-2 h-9 rounded-xl bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold border-none cursor-pointer"
            >
              {isSubmitting ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Shift Schedule View */}
      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Weekly Shift Roster"
        subtitle="Manage upcoming shift schedules."
        className="max-w-xl"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            {[
              { day: "Thursday (Today)", shift: "Lunch Peak", staff: "3 Members on floor" },
              { day: "Friday", shift: "Dinner Service", staff: "4 Members on floor" },
              { day: "Saturday", shift: "All Day", staff: "Full Team Roster" },
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
              className="px-4 py-2 h-9 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl border-none cursor-pointer"
            >
              Close Schedule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
