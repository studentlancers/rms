"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Lock, ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || "avery.lin@langham.com");
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row bg-white select-none">
      {/* Left Column: Dark Brand Hero Section */}
      <div className="w-full lg:w-1/2 bg-[#090d16] design-dot-grid text-white p-6 lg:p-10 flex flex-col justify-between h-full overflow-hidden border-r border-slate-800 shrink-0">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0052ff] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
            M
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-white">
            Mise
          </span>
        </div>

        {/* Hero Content Centered */}
        <div className="my-auto max-w-lg space-y-4 py-4">
          <div className="w-10 h-10 rounded-2xl bg-slate-900/90 text-blue-400 flex items-center justify-center border border-slate-800 shadow-inner">
            <Lock className="w-4 h-4 text-blue-400" />
          </div>

          <h1 className="font-display text-3xl lg:text-5xl font-semibold text-white leading-tight tracking-tight">
            A clearer way to run your restaurant.
          </h1>

          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed max-w-md">
            Join operators who use Mise to make better decisions, protect margins,
            and give their teams a calmer service.
          </p>

          {/* Social Proof */}
          <div className="pt-2 flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center justify-center">
                MC
              </div>
              <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold flex items-center justify-center">
                JD
              </div>
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center justify-center">
                SR
              </div>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Trusted by 2,000+ hospitality teams
            </span>
          </div>
        </div>

        {/* Footer Tag */}
        <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
          BUILT FOR HOSPITALITY · MADE FOR PEOPLE
        </div>
      </div>

      {/* Right Column: Sign In Form Section */}
      <div className="w-full lg:w-1/2 bg-white p-6 lg:p-10 flex flex-col justify-between h-full overflow-y-auto lg:overflow-hidden relative">
        {/* Top Right Back Link */}
        <div className="flex justify-end shrink-0">
          <Link
            href="/landing"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to site</span>
          </Link>
        </div>

        {/* Central Form Container */}
        <div className="max-w-md mx-auto my-auto w-full space-y-4 py-2">
          <div>
            <div className="design-section-label mb-2">WELCOME BACK</div>
            <h2 className="font-display text-2xl lg:text-4xl font-semibold text-slate-900 tracking-tight">
              Sign in to Mise.
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your details to access your workspace.
            </p>
          </div>

          {/* Social Google Login Button */}
          <button
            type="button"
            onClick={() => login("avery.lin@langham.com")}
            className="w-full py-2.5 px-4 border border-slate-200 hover:bg-slate-50 rounded-2xl text-xs font-semibold text-slate-800 flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
          >
            <div className="w-4 h-4 rounded bg-black text-white text-[10px] font-bold flex items-center justify-center">
              G
            </div>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="text-[10px] font-mono text-slate-400 font-semibold tracking-wider flex items-center gap-4 before:h-px before:flex-1 before:bg-slate-200/80 after:h-px after:flex-1 after:bg-slate-200/80 my-2">
            OR CONTINUE WITH EMAIL
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work email
              </label>
              <input
                type="email"
                required
                placeholder="you@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert("Password reset email sent!")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#0052ff] hover:bg-[#0046dc] text-white text-sm font-semibold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-1"
            >
              <span>Sign in</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center text-xs text-slate-500 pt-1">
            New to Mise?{" "}
            <Link
              href="/landing"
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Start your free trial
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-[11px] text-slate-400 text-center shrink-0 pt-2">
          By continuing, you agree to our{" "}
          <a href="#" className="font-semibold text-slate-600 hover:underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="font-semibold text-slate-600 hover:underline">
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </div>
  );
}
