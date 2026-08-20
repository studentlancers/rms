"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, Loader2, ShieldCheck, Building2, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listSuperAdminUsers } from "@/actions/super-admin";
import { toast } from "sonner";

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async (query = "") => {
    try {
      setIsLoading(true);
      const data = await listSuperAdminUsers(query);
      setUsers(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load platform users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">USER DIRECTORY</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Platform Users & Roles
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Inspect all registered platform users, system roles, organization memberships, and account statuses.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 h-10 bg-white border-slate-200 text-xs text-slate-900 rounded-xl focus:border-purple-500 shadow-2xs"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="h-10 px-4 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold border-none cursor-pointer"
          >
            Search
          </Button>
        </form>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-24 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <span className="text-xs font-mono">Fetching platform users directory...</span>
        </div>
      ) : (
        <div className="design-surface rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">USER NAME</th>
                <th className="py-3.5 px-4 font-semibold">EMAIL ADDRESS</th>
                <th className="py-3.5 px-4 font-semibold">PLATFORM ROLE</th>
                <th className="py-3.5 px-4 font-semibold">ORGANIZATION MEMBERSHIPS</th>
                <th className="py-3.5 px-4 font-semibold">REGISTERED DATE</th>
                <th className="py-3.5 px-4 font-semibold text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No users found matching search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      {u.name}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-600">
                      {u.email}
                    </td>
                    <td className="py-4 px-4">
                      {u.platformRole === "super_admin" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase">
                          <ShieldCheck className="w-3 h-3 text-blue-600" /> SUPER ADMIN
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          USER
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {u.memberships.length === 0 ? (
                        <span className="text-slate-400 font-mono text-[11px]">No org membership</span>
                      ) : (
                        <div className="space-y-1">
                          {u.memberships.map((m: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                              <span className="font-semibold text-slate-800">{m.organizationName}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                {m.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString([], { dateStyle: "medium" })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono">
                      {u.banned ? (
                        <span className="text-rose-600 font-bold text-[10px] uppercase">BANNED</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[10px] uppercase">ACTIVE</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
