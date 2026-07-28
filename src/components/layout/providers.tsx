"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { deleteUserPlugin } from "@/lib/auth/delete-user-plugin";
import { authClient } from "@/lib/auth-client";
import { getQueryClient } from "@/lib/query-client";
import { adminPlugin, organizationPlugin } from "@better-auth-ui/core/plugins";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/auth-provider";

export function Providers({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider
        authClient={authClient}
        redirectTo="/settings/account"
        viewPaths={{
          auth: {
            signIn: "signin",
            signUp: "signin",
            signOut: "sign-out",
          },
        }}
        navigate={({
          to,
          replace,
        }: {
          to: string;
          replace?: boolean;
        }) =>
          replace ? router.replace(to) : router.push(to)
        }
        plugins={[organizationPlugin(), adminPlugin()]}
        Link={Link}>
        {children}

        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
