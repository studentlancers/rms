"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Lock,
  User,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { getInvitationDetails } from "@/actions/staff";
import { Badge } from "@/components/ui/badge";

interface InvitationData {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  isExpired: boolean;
  organizationName: string;
  organizationSlug: string;
  inviterName: string;
}

export default function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const invitationId = resolvedParams.id;
  const router = useRouter();

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [mode, setMode] = useState<"create" | "signin">("create");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Session State
  const { data: session, isPending: isSessionLoading } = authClient.useSession();

  // Load invitation details
  useEffect(() => {
    async function loadDetails() {
      try {
        setLoading(true);
        const details = await getInvitationDetails(invitationId);
        setInvitation(details as any);
      } catch (err) {
        console.error("Error loading invitation details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [invitationId]);

  // Handle Accept for already logged in user matching email
  const handleLoggedInAccept = async () => {
    if (!invitation) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await authClient.organization.acceptInvitation({
        invitationId: invitation.id,
      });

      if (res.error) {
        throw new Error(res.error.message || "Failed to accept invitation.");
      }

      toast.success(`Joined ${invitation.organizationName} successfully!`);
      router.push(`/dashboard/${invitation.organizationSlug}`);
    } catch (err: any) {
      setFormError(err.message || "Failed to accept invitation");
      toast.error(err.message || "Failed to accept invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Form Submit (Account Creation or Sign In + Acceptance)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    setFormError(null);

    if (mode === "create") {
      const cleanName = name.trim();
      if (!cleanName || cleanName.length < 2) {
        setFormError("Please enter your full name (at least 2 characters)");
        return;
      }
      if (password.length < 8) {
        setFormError("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        setFormError("Passwords do not match");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === "create") {
        // Step 1: Create Account
        const signUpRes = await authClient.signUp.email({
          email: invitation.email,
          password: password,
          name: name.trim(),
        });

        if (signUpRes.error) {
          const errMsg = signUpRes.error.message || "";
          if (errMsg.toLowerCase().includes("already exists") || errMsg.toLowerCase().includes("user exists")) {
            // Attempt auto sign in for existing user account
            const signInRes = await authClient.signIn.email({
              email: invitation.email,
              password: password,
            });
            if (signInRes.error) {
              throw new Error("An account already exists for this email address. Please enter your existing password to join.");
            }
          } else {
            throw new Error(signUpRes.error.message || "Failed to create account.");
          }
        }
      } else {
        // Step 1: Sign In for existing user
        const signInRes = await authClient.signIn.email({
          email: invitation.email,
          password: password,
        });

        if (signInRes.error) {
          throw new Error(signInRes.error.message || "Invalid password or credentials.");
        }
      }

      // Step 2: Accept Invitation
      const acceptRes = await authClient.organization.acceptInvitation({
        invitationId: invitation.id,
      });

      if (acceptRes.error) {
        throw new Error(acceptRes.error.message || "Failed to accept organization invitation.");
      }

      // Step 3: Set active organization
      try {
        await authClient.organization.setActive({
          organizationId: (invitation as any).organizationId || invitation.id,
        });
      } catch {
        // Ignore set active error fallback
      }

      toast.success(`Welcome to ${invitation.organizationName}!`);

      // Step 4: Redirect to appropriate workspace
      const redirectPath = invitation.role === "staff"
        ? `/dashboard/${invitation.organizationSlug}/orders`
        : `/dashboard/${invitation.organizationSlug}`;

      router.push(redirectPath);
    } catch (err: any) {
      console.error("Acceptance error:", err);
      setFormError(err.message || "An unexpected error occurred.");
      toast.error(err.message || "Failed to complete setup.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Sign Out if logged in as wrong user
  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.reload();
  };

  if (loading || isSessionLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-sm font-medium text-slate-400">Verifying invitation link...</span>
      </div>
    );
  }

  // State: Invitation Not Found
  if (!invitation) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white">Invalid Invitation</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This invitation link is invalid or does not exist. Please double-check the URL or request a new invitation from your restaurant owner.
          </p>
          <div className="pt-4">
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State: Invitation Cancelled / Expired / Already Accepted
  const isInvalidStatus =
    invitation.status !== "pending" || invitation.isExpired;

  if (isInvalidStatus) {
    let title = "Invitation Unavailable";
    let message = "This invitation cannot be used.";

    if (invitation.status === "accepted") {
      title = "Invitation Already Accepted";
      message = `This invitation for ${invitation.organizationName} has already been accepted.`;
    } else if (invitation.status === "canceled") {
      title = "Invitation Cancelled";
      message = "This invitation has been cancelled by the restaurant owner.";
    } else if (invitation.isExpired) {
      title = "Invitation Expired";
      message = "This invitation link has expired. Please ask the owner to send a new invite.";
    }

    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
          <div className="pt-4 flex justify-center gap-3">
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all"
            >
              <span>Sign in to Mise</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if caller is already logged in
  const currentUserEmail = session?.user?.email;
  const isUserMatchingInvite =
    currentUserEmail &&
    currentUserEmail.toLowerCase() === invitation.email.toLowerCase();

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-lg space-y-6 my-auto py-8">
        {/* Top Brand Tag */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-base shadow-lg shadow-blue-600/30">
            M
          </div>
          <span className="font-display text-2xl font-bold text-white tracking-tight">
            Mise Staff Portal
          </span>
        </div>

        {/* Invitation Summary Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Building2 className="w-32 h-32 text-blue-500" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Team Invitation</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Join {invitation.organizationName}
            </h1>
            <p className="text-xs text-slate-400">
              Invited by <span className="text-slate-200 font-semibold">{invitation.inviterName}</span>
            </p>
          </div>

          {/* Invitation Details Breakdown */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
                INVITED EMAIL
              </div>
              <div className="font-mono text-slate-200 font-medium truncate mt-0.5">
                {invitation.email}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
                ASSIGNED ROLE
              </div>
              <div className="mt-0.5">
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-400 border-blue-500/30 uppercase text-[10px] px-2 py-0.5"
                >
                  {invitation.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Form Error Banner */}
          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* SCENARIO A: User is already logged in with matching email */}
          {isUserMatchingInvite ? (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>You are currently signed in as <strong>{currentUserEmail}</strong>.</span>
              </div>

              <button
                type="button"
                onClick={handleLoggedInAccept}
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Joining Restaurant...</span>
                  </>
                ) : (
                  <>
                    <span>Accept Invitation & Join Team</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : session?.user ? (
            /* SCENARIO B: User is logged in with a DIFFERENT email */
            <div className="space-y-4 pt-2">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Email Mismatch</span>
                </div>
                <p className="text-[11px] text-amber-200/80">
                  You are logged in as <strong>{currentUserEmail}</strong>, but this invitation was sent to <strong>{invitation.email}</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out to Accept Invitation</span>
              </button>
            </div>
          ) : (
            /* SCENARIO C: Unauthenticated User Form (Create Account or Sign In) */
            <div className="space-y-4 pt-2">
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-slate-950 p-1 text-xs font-semibold border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode("create");
                    setFormError(null);
                  }}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    mode === "create"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Create New Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setFormError(null);
                  }}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    mode === "signin"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign In to Accept
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === "create" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Jordan Lee"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 transition-all"
                      />
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Work Email (Read-Only)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={invitation.email}
                      className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 font-mono cursor-not-allowed"
                    />
                    <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {mode === "create" ? "Create Password *" : "Password *"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {mode === "create" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 transition-all"
                      />
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{mode === "create" ? "Creating Account..." : "Signing in..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === "create" ? "Create Account & Join Team" : "Sign In & Accept Invitation"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-[11px] text-slate-500 text-center">
          Mise Restaurant Operations Platform · Powered by Better Auth Multi-Tenancy
        </div>
      </div>
    </div>
  );
}
