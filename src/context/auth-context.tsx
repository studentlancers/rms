// "use client";

// import React, { createContext, useContext, useEffect, useState } from "react";
// import { useRouter, usePathname } from "next/navigation";
// import { authClient } from "@/lib/auth-client";

// interface UserProfile {
//   id: string;
//   name: string;
//   email: string;
//   role?: string;
//   image?: string | null;
// }

// interface ActiveOrg {
//   id: string;
//   name: string;
//   slug: string;
//   logo?: string | null;
// }

// interface AuthContextType {
//   isAuthenticated: boolean;
//   isPending: boolean;
//   user: UserProfile | null;
//   activeOrganization: ActiveOrg | null;
//   login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
//   signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
//   logout: () => Promise<void>;
//   refetchSession: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const { data: sessionData, isPending: sessionPending, refetch } = authClient.useSession();
//   const { data: activeOrgData, isPending: orgPending } = authClient.useActiveOrganization();
//   const router = useRouter();
//   const pathname = usePathname();

//   const isPending = sessionPending || orgPending;
//   const isAuthenticated = !!sessionData?.user;

//   const user: UserProfile | null = sessionData?.user
//     ? {
//         id: sessionData.user.id,
//         name: sessionData.user.name || "User",
//         email: sessionData.user.email,
//         image: sessionData.user.image,
//         role: (sessionData.user as { role?: string }).role || "Owner",
//       }
//     : null;

//   const activeOrganization: ActiveOrg | null = activeOrgData
//     ? {
//         id: activeOrgData.id,
//         name: activeOrgData.name,
//         slug: activeOrgData.slug,
//         logo: activeOrgData.logo,
//       }
//     : null;

//   // Route protection
//   useEffect(() => {
//     if (isPending) return;

//     const isPublicRoute =
//       pathname === "/signin" ||
//       pathname === "/landing" ||
//       pathname.startsWith("/api/");

//     if (!isAuthenticated && !isPublicRoute) {
//       router.push("/signin");
//     }
//   }, [isAuthenticated, isPending, pathname, router]);

//   const login = async (email: string, password: string) => {
//     try {
//       const res = await authClient.signIn.email({
//         email,
//         password,
//       });

//       if (res.error) {
//         return { success: false, error: res.error.message || "Failed to sign in" };
//       }

//       refetch();
//       router.push("/owner");
//       return { success: true };
//     } catch (err: unknown) {
//       const msg = err instanceof Error ? err.message : "An unexpected error occurred";
//       return { success: false, error: msg };
//     }
//   };

//   const signup = async (email: string, password: string, name: string) => {
//     try {
//       const res = await authClient.signUp.email({
//         email,
//         password,
//         name,
//       });

//       if (res.error) {
//         return { success: false, error: res.error.message || "Failed to create account" };
//       }

//       refetch();
//       router.push("/onboarding/create-restaurant");
//       return { success: true };
//     } catch (err: unknown) {
//       const msg = err instanceof Error ? err.message : "An unexpected error occurred";
//       return { success: false, error: msg };
//     }
//   };

//   const logout = async () => {
//     await authClient.signOut();
//     refetch();
//     router.push("/signin");
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         isAuthenticated,
//         isPending,
//         user,
//         activeOrganization,
//         login,
//         signup,
//         logout,
//         refetchSession: refetch,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// }
