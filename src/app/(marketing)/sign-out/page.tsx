"use client";

import { useEffect, useRef } from "react";
import { useSignOut } from "@/hooks/use-auth-actions";
import { Loader2 } from "lucide-react";

export default function SignOutPage() {
  const { signOut } = useSignOut();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    signOut({ redirectTo: "/signin" });
  }, [signOut]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d16] text-white">
      <div className="flex items-center gap-3 text-slate-300 font-medium">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        <span>Signing out...</span>
      </div>
    </div>
  );
}
