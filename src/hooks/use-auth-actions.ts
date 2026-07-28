"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";

/* -------------------------------------------------------------------------- */
/* Sign Up                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * useSignUp
 * Email/password registration. By default Better Auth auto-signs the
 * user in after sign-up (unless autoSignIn: false is set on the server),
 * so on success you likely want to route straight into onboarding.
 */
export function useSignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signUp(
    name: string,
    email: string,
    password: string,
    options?: { redirectTo?: string; onSuccess?: () => void }
  ) {
    setIsLoading(true);
    setError(null);

    const { data, error: signUpError } = await authClient.signUp.email({
      name: name,
      email: email,
      password: password,
    });

    setIsLoading(false);

    if (signUpError) {
      setError(signUpError.message ?? "Unable to create account.");
      return { success: false as const, error: signUpError };
    }

    if (options?.onSuccess) {
      options.onSuccess();
    } else {
      router.push(options?.redirectTo ?? "/onboarding/create-restaurant");
    }

    return { success: true as const, data };
  }

  return { signUp, isLoading, error, clearError: () => setError(null) };
}

/* -------------------------------------------------------------------------- */
/* Sign In                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * useSignIn
 * Email/password sign-in with loading + error state built in.
 */
export function useSignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(
    email: string,
    password: string,
    options?: { redirectTo?: string; onSuccess?: () => void }
  ) {
    setIsLoading(true);
    setError(null);

    const { data, error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    setIsLoading(false);

    if (signInError) {
      setError(signInError.message ?? "Unable to sign in. Please try again.");
      return { success: false as const, error: signInError };
    }

    if (options?.onSuccess) {
      options.onSuccess();
    } else {
      router.push(options?.redirectTo ?? "/dashboard");
    }

    return { success: true as const, data };
  }

  return { signIn, isLoading, error, clearError: () => setError(null) };
}

/* -------------------------------------------------------------------------- */
/* Sign Out                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * useSignOut
 * Signs the user out and redirects. Defaults to role-aware destinations
 * (Super Admin -> /admin/sign-in, everyone else -> /sign-in).
 */
export function useSignOut() {
  const router = useRouter();
  const { role } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  async function signOut(options?: { redirectTo?: string }) {
    setIsLoading(true);

    const clearLocalSession = () => {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.clear();
          localStorage.removeItem("better-auth.activeOrgId");
        } catch (e) {
          console.error("Failed to clear local storage during signout", e);
        }
      }
    };

    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            setIsLoading(false);
            clearLocalSession();
            const fallback = role === "superadmin" ? "/admin/sign-in" : "/signin";
            const target = options?.redirectTo ?? fallback;
            router.push(target);
            router.refresh();
          },
          onError: () => {
            setIsLoading(false);
            clearLocalSession();
            const target = options?.redirectTo ?? "/signin";
            router.push(target);
            router.refresh();
          },
        },
      });
    } catch {
      setIsLoading(false);
      clearLocalSession();
      const target = options?.redirectTo ?? "/signin";
      router.push(target);
      router.refresh();
    }
  }

  return { signOut, isLoading };
}

/* -------------------------------------------------------------------------- */
/* Password Reset                                                             */
/* -------------------------------------------------------------------------- */

/**
 * useRequestPasswordReset
 * Step 1: user submits their email, gets a reset link.
 */
export function useRequestPasswordReset() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  async function requestReset(email: string, redirectTo = "/reset-password") {
    setIsLoading(true);
    setError(null);

    const { error: reqError } = await authClient.requestPasswordReset({
      email,
      redirectTo,
    });

    setIsLoading(false);

    if (reqError) {
      setError(reqError.message ?? "Unable to send reset email.");
      return { success: false as const };
    }

    setIsSent(true);
    return { success: true as const };
  }

  return { requestReset, isLoading, error, isSent };
}

/**
 * useResetPassword
 * Step 2: user lands on /reset-password?token=... and submits a new password.
 */
export function useResetPassword() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resetPassword(newPassword: string, redirectTo = "/sign-in") {
    setIsLoading(true);
    setError(null);

    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setIsLoading(false);
      setError("Reset link is missing or invalid. Request a new one.");
      return { success: false as const };
    }

    const { error: resetError } = await authClient.resetPassword({
      newPassword,
      token,
    });

    setIsLoading(false);

    if (resetError) {
      setError(resetError.message ?? "Unable to reset password.");
      return { success: false as const };
    }

    router.push(redirectTo);
    return { success: true as const };
  }

  return { resetPassword, isLoading, error };
}

/* -------------------------------------------------------------------------- */
/* Email Verification ("validate account")                                    */
/* -------------------------------------------------------------------------- */

/**
 * useSendVerificationEmail
 * Triggers (or re-triggers) the "validate your account" email.
 */
export function useSendVerificationEmail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  async function sendVerification(email: string, callbackURL = "/dashboard") {
    setIsLoading(true);
    setError(null);

    const { error: sendError } = await authClient.sendVerificationEmail({
      email,
      callbackURL,
    });

    setIsLoading(false);

    if (sendError) {
      setError(sendError.message ?? "Unable to send verification email.");
      return { success: false as const };
    }

    setIsSent(true);
    return { success: true as const };
  }

  return { sendVerification, isLoading, error, isSent };
}

/**
 * useVerifyEmail
 * For the landing page the verification link points to
 * (e.g. /verify-email?token=...). Runs on mount, reads the token,
 * and reports status so you can show your own "Verifying..." UI.
 */
export function useVerifyEmail() {
  const router = useRouter();
  const [status, setStatus] = useState<
    "verifying" | "success" | "error" | "missing-token"
  >("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setStatus("missing-token");
      return;
    }

    authClient
      .$fetch("/verify-email", { query: { token } })
      .then(({ error: verifyError }) => {
        if (verifyError) {
          setStatus("error");
          setError(verifyError.message ?? "This link is invalid or expired.");
        } else {
          setStatus("success");
        }
      });
  }, []);

  function goToDashboard(redirectTo = "/dashboard") {
    router.push(redirectTo);
  }

  return { status, error, goToDashboard };
}