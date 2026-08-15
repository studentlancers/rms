"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Package, ShieldAlert, Split, Save } from "lucide-react";
import { getBillingSettings, updateBillingSettings } from "@/actions/billing-settings";

export function BillingChargesSettings() {
  const [packagingDefault, setPackagingDefault] = useState<string>("0");
  const [serviceDefault, setServiceDefault] = useState<string>("0");
  const [splittingDefault, setSplittingDefault] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await getBillingSettings();
      setPackagingDefault(settings.defaultPackagingCharge.toString());
      setServiceDefault(settings.defaultServiceCharge.toString());
      setSplittingDefault(settings.defaultSplittingCharge.toString());
    } catch (err: any) {
      toast.error(err.message || "Failed to load charge settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = parseFloat(packagingDefault);
    const svc = parseFloat(serviceDefault);
    const splt = parseFloat(splittingDefault);

    if (isNaN(pkg) || pkg < 0) {
      toast.error("Packaging Charge default must be a valid number >= 0");
      return;
    }
    if (isNaN(svc) || svc < 0) {
      toast.error("Service Charge default must be a valid number >= 0");
      return;
    }
    if (isNaN(splt) || splt < 0) {
      toast.error("Splitting Charge default must be a valid number >= 0");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await updateBillingSettings({
        defaultPackagingCharge: pkg,
        defaultServiceCharge: svc,
        defaultSplittingCharge: splt,
      });
      if (saved) {
        setPackagingDefault((saved.defaultPackagingCharge ?? pkg).toString());
        setServiceDefault((saved.defaultServiceCharge ?? svc).toString());
        setSplittingDefault((saved.defaultSplittingCharge ?? splt).toString());
      }
      toast.success("Default bill charge prices saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update default charge prices");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-400 gap-2 text-xs">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span>Loading charge default settings...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Default Bill Charge Settings</h2>
        <p className="text-xs text-slate-500 mt-1">
          Set default prices for optional charges. When staff or owners generate a bill, these amounts will be pre-filled as default options.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
            <Package className="w-4 h-4 text-blue-600" />
            <span>Packaging Charge (₹)</span>
          </div>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={packagingDefault}
            onChange={(e) => setPackagingDefault(e.target.value)}
            className="w-full bg-white font-mono text-xs"
            placeholder="0"
          />
          <p className="text-[11px] text-slate-500">Default takeaway/package fee.</p>
        </div>

        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            <span>Service Charge (₹)</span>
          </div>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={serviceDefault}
            onChange={(e) => setServiceDefault(e.target.value)}
            className="w-full bg-white font-mono text-xs"
            placeholder="0"
          />
          <p className="text-[11px] text-slate-500">Default service/table fee.</p>
        </div>

        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
            <Split className="w-4 h-4 text-purple-600" />
            <span>Splitting Charge (₹)</span>
          </div>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={splittingDefault}
            onChange={(e) => setSplittingDefault(e.target.value)}
            className="w-full bg-white font-mono text-xs"
            placeholder="0"
          />
          <p className="text-[11px] text-slate-500">Default bill splitting fee.</p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-[#0052ff] hover:bg-[#0046dc] text-white text-xs font-semibold px-5 py-2.5 rounded-xl border-none cursor-pointer flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Charge Defaults</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
