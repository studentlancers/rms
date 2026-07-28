"use client";

// src/app/onboarding/create-restaurant/page.tsx
// Mandatory onboarding page for new owners.
// Features: Auto-generated slug, centered card layout, design system styling.

import React, { useState } from "react";
import { createRestaurant } from "@/actions/restaurants";
import { UtensilsCrossed, ArrowRight, Building2, Loader2, AlertCircle } from "lucide-react";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CreateRestaurantPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!isSlugManuallyEdited) {
      setSlug(slugify(newName));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
    setIsSlugManuallyEdited(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);

      await createRestaurant(formData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create restaurant";
      // Next.js redirect throws a control-flow exception — ignore it
      if (!msg.includes("NEXT_REDIRECT")) {
        setError(msg);
        setLoading(false);
      }
    }
  };

  return (
    <div className="h-screen w-screen bg-[#fafafa] flex items-center justify-center p-4 select-none">
      <div className="max-w-md w-full design-surface p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
        {/* Header Icon */}
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-[#0052ff] text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-mono font-semibold tracking-widest text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-full">
            STEP 1 OF 1
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
            Set up your restaurant
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Name your restaurant to initialize your workspace, staff permissions, and operations engine.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Restaurant Name
            </label>
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. The Langham Bistro"
                value={name}
                onChange={handleNameChange}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all bg-white pl-10"
              />
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Restaurant Identifier (Slug)
              </label>
              {isSlugManuallyEdited && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSlugManuallyEdited(false);
                    setSlug(slugify(name));
                  }}
                  className="text-[10px] font-semibold text-blue-600 hover:underline"
                >
                  Reset auto-slug
                </button>
              )}
            </div>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              placeholder="e.g. langham-bistro"
              pattern="^[a-z0-9-]+$"
              title="Lowercase letters, numbers, and hyphens only"
              value={slug}
              onChange={handleSlugChange}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all bg-white font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Auto-generated from name. Lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-[#0052ff] hover:bg-[#0046dc] disabled:opacity-70 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Creating Restaurant...</span>
              </>
            ) : (
              <>
                <span>Create Restaurant Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
