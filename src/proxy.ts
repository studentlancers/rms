// src/proxy.ts (Next.js 16 replacement for middleware.ts)
// Runs at the Edge before every request.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Routes that are always public (no auth required).
const PUBLIC_ROUTES = [
  "/login",
  "/signin",
  "/sigin",
  "/sign-out",
  "/auth/sign-out",
  "/landing",
  "/api/auth",
  "/api/payments/webhook",
  "/accept-invitation",
];

const ONBOARDING_ROUTES = ["/onboarding"];

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

function isOnboarding(pathname: string): boolean {
  return ONBOARDING_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle typo /sigin -> redirect to /signin
  if (pathname === "/sigin") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // 1. Always allow static assets through.
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|otf|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Session check for all routes (to allow redirecting authenticated users on public login pages)
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    // Unauthenticated user on public route -> allow through
    if (isPublic(pathname)) {
      return NextResponse.next();
    }
    // Unauthenticated user on protected route -> redirect to /login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = session.user as { id: string; role?: string };

  // 3. Super Admin — platform-wide access, direct to /super-admin
  if (user.role === "super_admin") {
    if (
      pathname === "/login" ||
      pathname === "/signin" ||
      pathname === "/" ||
      pathname.startsWith("/dashboard") ||
      pathname === "/tenants"
    ) {
      return NextResponse.redirect(new URL("/super-admin", request.url));
    }
    return NextResponse.next();
  }

  const isSuperAdminPath = pathname === "/super-admin" || pathname.startsWith("/super-admin/");

  // 4. Org-scoped users: fetch organizations and active member in parallel
  let userOrgs: Array<{ id: string; name: string; slug: string; isActive?: boolean }> = [];
  let member: { role: string; organizationId: string } | null = null;

  try {
    const [orgs, activeMember] = await Promise.all([
      auth.api.listOrganizations({ headers: request.headers }).catch(() => []),
      auth.api.getActiveMember({ headers: request.headers }).catch(() => null),
    ]);

    if (Array.isArray(orgs)) {
      userOrgs = orgs as any;
    }
    member = activeMember;

    if (!member && userOrgs.length > 0) {
      await auth.api.setActiveOrganization({
        body: { organizationId: userOrgs[0].id },
        headers: request.headers,
      });
      member = await auth.api.getActiveMember({
        headers: request.headers,
      }).catch(() => null);
    }
  } catch {
    // Ignore resolution errors
  }

  const orgRole = member?.role || "owner";

  // 5. STAFF ROUTING & SECURITY CONTROL
  // Staff users MUST ONLY use /staff and /staff/*
  // They are strictly blocked from /dashboard/*, /super-admin/*, and /onboarding/*
  if (orgRole === "staff") {
    if (
      isSuperAdminPath ||
      isOnboarding(pathname) ||
      pathname.startsWith("/dashboard")
    ) {
      return NextResponse.redirect(new URL("/staff", request.url));
    }
    if (pathname === "/login" || pathname === "/signin" || pathname === "/") {
      return NextResponse.redirect(new URL("/staff", request.url));
    }
    return NextResponse.next();
  }

  // 6. OWNER & ADMIN ROUTING & SECURITY CONTROL
  // Protect /super-admin routes for non super_admins
  if (isSuperAdminPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // GATE A: Owner/Admin user has ZERO organizations -> MUST be on /onboarding/create-restaurant
  if (userOrgs.length === 0) {
    if (!isOnboarding(pathname)) {
      return NextResponse.redirect(
        new URL("/onboarding/create-restaurant", request.url)
      );
    }
    return NextResponse.next();
  }

  const activeOrg = userOrgs.find((o) => o.id === member?.organizationId) || userOrgs[0];
  const activeSlug = activeOrg?.slug || "restaurant";

  // GATE B: Owner/Admin HAS 1+ organizations -> CANNOT be on /onboarding/create-restaurant
  if (userOrgs.length > 0 && isOnboarding(pathname)) {
    return NextResponse.redirect(new URL(`/dashboard/${activeSlug}`, request.url));
  }

  // If Owner/Admin is authenticated and lands on /login or /signin -> redirect to owner workspace
  if (pathname === "/login" || pathname === "/signin") {
    return NextResponse.redirect(new URL(`/dashboard/${activeSlug}`, request.url));
  }

  // Tenant Boundary Check for Owner/Admin — prevent users from modifying slug to access another restaurant
  const pathParts = pathname.split("/");
  if (pathParts[1] === "dashboard" && pathParts[2]) {
    const requestedSlug = pathParts[2];
    const isMemberOfRequestedOrg = userOrgs.some((o) => o.slug === requestedSlug);
    if (!isMemberOfRequestedOrg) {
      return NextResponse.redirect(new URL(`/dashboard/${activeSlug}`, request.url));
    }
  }

  // Redirect Owner/Admin on root or /dashboard to their active slug dashboard
  if (pathname === "/" || pathname === "/dashboard") {
    return NextResponse.redirect(new URL(`/dashboard/${activeSlug}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
