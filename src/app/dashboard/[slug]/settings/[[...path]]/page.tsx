"use client";

import React, { use } from "react";
import { Settings } from "@/components/auth/settings/settings";

export default function UserSettingsPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const resolvedParams = use(params);
  const pathSegment = resolvedParams?.path?.[0] || "account";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <div className="text-[10px] font-mono font-semibold tracking-widest text-blue-600 uppercase mb-1">
          USER SETTINGS
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
          Account & Security Settings
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your personal profile, security preferences, and active sessions.
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">
        <Settings path={pathSegment} />
      </div>
    </div>
  );
}
