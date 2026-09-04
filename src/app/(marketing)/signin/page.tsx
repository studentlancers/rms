"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ArrowLeft, ArrowRight, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useAuthActions } from "@/lib/auth-action";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuthActions();
  const { data: session, isPending: isSessionLoading } = authClient.useSession();

  const [mode, setMode] = useState<"signin" | "signUp">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSessionLoading && session?.user) {
      router.replace("/dashboard");
    }
  }, [session, isSessionLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    if (mode === "signin") {
      const res = await signIn(cleanEmail, password, { redirectTo: "/dashboard" });
      if (!res.success && res.error) {
        setError(res.error.message || "Unable to sign in.");
      }
    } else {
      const cleanName = name.trim();
      if (!cleanName || cleanName.length < 2) {
        setError("Please enter your full name (at least 2 characters).");
        setLoading(false);
        return;
      }
      const res = await signUp(cleanName, cleanEmail, password);
      if (!res.success && res.error) {
        setError(res.error.message || "Unable to create account.");
      }
    }

    setLoading(false);
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

      {/* Right Column: Sign In / Sign Up Form Section */}
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
            <div className="design-section-label mb-2">
              {mode === "signin" ? "WELCOME BACK" : "CREATE YOUR ACCOUNT"}
            </div>
            <h2 className="font-display text-2xl lg:text-4xl font-semibold text-slate-900 tracking-tight">
              {mode === "signin" ? "Sign in to Mise." : "Start with Mise."}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {mode === "signin"
                ? "Enter your credentials to access your restaurant workspace."
                : "Create an account as a restaurant owner to get started."}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === "signin"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign In
            </button> 
            <button
              type="button"
              onClick={() => {
                setMode("signUp");
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === "signUp"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signUp" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Avery Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all bg-white"
                />
              </div>
            )}

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
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => alert("Password reset link available via admin.")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
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
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#0052ff] hover:bg-[#0046dc] disabled:opacity-70 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{mode === "signin" ? "Signing in..." : "Creating account..."}</span>
                </>
              ) : (
                <>
                  <span>{mode === "signin" ? "Sign in" : "Create Owner Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Toggle Link */}
          <div className="text-center text-xs text-slate-500 pt-1">
            {mode === "signin" ? (
              <>
                New restaurant owner?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signUp");
                    setError(null);
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign in instead
                </button>
              </>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-[11px] text-slate-400 text-center shrink-0 pt-2">
          By continuing, you agree to our Terms and Privacy Policy.
        </div>
      </div>
    </div>
  );
}
