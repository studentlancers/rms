"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { OrganizationSettings } from "@/components/auth/organization/organization-settings";
import { OrganizationPeople } from "@/components/auth/organization/organization-people";
import { BillingChargesSettings } from "@/components/settings/billing-charges-settings";

export default function OrganizationSettingsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <div className="text-[10px] font-mono font-semibold tracking-widest text-blue-600 uppercase mb-1">
          RESTAURANT ADMIN
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
          Restaurant Settings
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage restaurant details, staff roles, and default bill charges.
        </p>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">
            Settings
          </TabsTrigger>
          <TabsTrigger value="charges">Bill Charges</TabsTrigger>
          <TabsTrigger value="staff">staff</TabsTrigger>
        </TabsList>

        <TabsContent
          value="settings"
          className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs mt-4">
          <OrganizationSettings />
        </TabsContent>

        <TabsContent
          value="charges"
          className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs mt-4">
          <BillingChargesSettings />
        </TabsContent>

        <TabsContent
          value="staff"
          className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs mt-4">
          <OrganizationPeople />
        </TabsContent>
      </Tabs>
    </div>
  );
}
