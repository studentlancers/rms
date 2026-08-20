"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  ShoppingBag,
  IndianRupee,
  ShieldAlert,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  listSuperAdminOrganizations,
  toggleOrganizationStatus,
} from "@/actions/super-admin";
import { toast } from "sonner";

export default function SuperAdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrganizations = async (query = "") => {
    try {
      setIsLoading(true);
      const data = await listSuperAdminOrganizations(query);
      setOrganizations(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load organizations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrganizations(searchQuery);
  };

  const handleToggleStatus = async (orgId: string, currentIsActive: boolean) => {
    const newStatus = !currentIsActive;
    setUpdatingId(orgId);
    try {
      await toggleOrganizationStatus(orgId, newStatus);
      toast.success(
        `Organization ${newStatus ? "activated" : "deactivated"} successfully`
      );
      await fetchOrganizations(searchQuery);
    } catch (err: any) {
      toast.error(err.message || "Failed to update organization status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">TENANT MANAGEMENT</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Restaurant Organizations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Inspect all registered multi-tenant restaurant organizations, member counts, revenue, and active statuses.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by restaurant name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 h-10 bg-white border-slate-200 text-xs text-slate-900 rounded-xl focus:border-blue-500 shadow-2xs"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="h-10 px-4 text-xs bg-[#0052ff] hover:bg-[#0046dc] text-white rounded-full font-semibold border-none cursor-pointer"
          >
            Search
          </Button>
        </form>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-24 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-mono">Fetching multi-tenant organizations...</span>
        </div>
      ) : (
        <div className="design-surface rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">RESTAURANT NAME</th>
                <th className="py-3.5 px-4 font-semibold">OWNER / EMAIL</th>
                <th className="py-3.5 px-4 font-semibold">MEMBERS</th>
                <th className="py-3.5 px-4 font-semibold">TOTAL ORDERS</th>
                <th className="py-3.5 px-4 font-semibold">REVENUE (₹)</th>
                <th className="py-3.5 px-4 font-semibold">CREATED DATE</th>
                <th className="py-3.5 px-4 font-semibold">STATUS</th>
                <th className="py-3.5 px-4 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {organizations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    No organizations found matching search criteria.
                  </td>
                </tr>
              ) : (
                organizations.map((org) => {
                  const isUpdating = updatingId === org.id;

                  return (
                    <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">{org.name}</div>
                        <div className="text-[10px] font-mono text-blue-600 font-semibold">/{org.slug}</div>
                      </td>
                      <td className="py-4 px-4">
                        {org.owner ? (
                          <div>
                            <div className="font-semibold text-slate-800">{org.owner.name}</div>
                            <div className="text-[10px] font-mono text-slate-500">{org.owner.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">No Owner</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono">
                        <div className="text-slate-800 font-semibold">{org.totalMembers} total</div>
                        <div className="text-[10px] text-slate-500">
                          {org.adminCount} Admins • {org.staffCount} Staff
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-800">
                        {org.totalOrders}
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-emerald-600">
                        ₹{org.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-500">
                        {new Date(org.createdAt).toLocaleDateString([], { dateStyle: "medium" })}
                      </td>
                      <td className="py-4 px-4">
                        {org.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                            <XCircle className="w-3 h-3 text-rose-600" /> DEACTIVATED
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/super-admin/organizations/${org.id}`}
                            className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200/60 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleToggleStatus(org.id, org.isActive)}
                            className={org.isActive
                              ? "text-rose-600 hover:bg-rose-50 border border-rose-200 h-8 px-3 text-xs rounded-full cursor-pointer"
                              : "text-emerald-600 hover:bg-emerald-50 border border-emerald-200 h-8 px-3 text-xs rounded-full cursor-pointer"
                            }
                          >
                            {isUpdating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : org.isActive ? (
                              "Deactivate"
                            ) : (
                              "Activate"
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
