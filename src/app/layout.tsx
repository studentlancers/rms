import type { Metadata } from "next";
import {
  Calistoga,
  Inter,
  JetBrains_Mono,
  Geist,
} from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import AppShell from "@/components/layout/app-shell";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const calistoga = Calistoga({
  variable: "--font-calistoga",
  subsets: ["latin"],
  weight: "400",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mise — Restaurant & Operations Management System",
  description:
    "Keep your restaurant aligned, scheduled, and supported with real-time operations, inventory cost control, and staff scheduling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        inter.variable,
        calistoga.variable,
        jetBrainsMono.variable,
        "font-sans",
        geist.variable,
      )}>
      <body className="h-screen w-screen overflow-hidden bg-[#fafafa] text-slate-900 font-sans">
        <TooltipProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
