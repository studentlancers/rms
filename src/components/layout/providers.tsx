"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { deleteUserPlugin } from "@/lib/auth/delete-user-plugin";
import { authClient } from "@/lib/auth-client";
import { getQueryClient } from "@/lib/query-client";
import {
  adminPlugin,
  organizationPlugin,
} from "@better-auth-ui/core/plugins";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/auth-provider";

export function Providers({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const queryClient = getQueryClient();

  const params = useParams<{ slug?: string }>();
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
        plugins={[
          organizationPlugin({
            roles: {
              owner: "Owner",
              admin: "Admin",
              member: "Staff",
            },
            localization: {
              organization: "Restaurant",
              organizations: "Restaurants",
              organizationProfile: "Restaurant profile",
              organizationsDescription:
                "Create a restaurant to manage your staff and operations.",
              createOrganization: "Create restaurant",
              deleteOrganization: "Delete restaurant",
              deleteOrganizationDescription:
                "Permanently delete this restaurant and all of its data. All staff will lose access and this cannot be undone.",
              leaveOrganization: "Leave restaurant",
              leaveOrganizationDescription:
                "Leave this restaurant and lose access to its data and resources. You'll need a new invitation to rejoin.",
              organizationDeleted: "Restaurant deleted",
              organizationUpdatedSuccess:
                "Restaurant updated successfully",
              noOrganizations: "No restaurants",
              namePlaceholder: "Enter the restaurant name",
              organizationInvitationsEmptyDescription:
                "Invite a team member to collaborate in this restaurant.",
              personalAccount: "Personal account",

              // Member overrides
              member: "Staff",
              members: "Staff",
              removeMember: "Remove staff",
              removeMemberWarning:
                "Are you sure you want to remove this staff member from the restaurant? They will lose access immediately.",
              memberRemoved: "Staff removed",
              memberRoleUpdated: "Staff role updated",
              changeMemberRole: "Change role",
              inviteMember: "Invite staff",
              inviteMemberSuccess:
                "Staff invited successfully",
              inviteMemberDescription:
                "We'll email them a link to join this restaurant. Choose the role they'll have once they accept.",
              people: "Staff",
            },
          }),
          adminPlugin(),
        ]}
        Link={Link}>
        {children}

        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
