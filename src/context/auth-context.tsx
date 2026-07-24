"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { name: string; email: string; role: string } | null;
  login: (email?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [user, setUser] = useState({
    name: "Avery Lin",
    email: "avery.lin@langham.com",
    role: "General Manager",
  });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Sync authentication state from localStorage
    const authStored = localStorage.getItem("mise_auth");
    if (authStored === "false") {
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    // Route protection: If unauthenticated and on protected dashboard route, redirect to /signin
    const isPublicRoute = pathname === "/signin" || pathname === "/landing";
    const authStored = localStorage.getItem("mise_auth");

    if (authStored === "false" && !isPublicRoute) {
      router.push("/signin");
    }
  }, [pathname, router]);

  const login = (email?: string) => {
    setIsAuthenticated(true);
    localStorage.setItem("mise_auth", "true");
    if (email) {
      setUser((prev) => ({ ...prev, email }));
    }
    router.push("/");
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem("mise_auth", "false");
    router.push("/signin");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
