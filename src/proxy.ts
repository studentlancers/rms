// src/proxy.ts (Next.js 16 replacement for middleware.ts)
// Runs at the Edge before every request.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Routes that are always public (no auth required).
const PUBLIC_ROUTES = [
  "/signin",
  "/sigin",
  "/sign-out",
  "/auth/sign-out",
  "/landing",
  "/api/auth",
  "/api/payments/webhook",
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

  // 2. Allow public routes through without session check.
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // 3. Session check
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signinUrl);
  }

  const user = session.user as { id: string; role?: string };

  // 4. Protect /super-admin routes — ONLY accessible to super_admin
  const isSuperAdminPath = pathname === "/super-admin" || pathname.startsWith("/super-admin/");
  if (isSuperAdminPath && user.role !== "super_admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 5. Super Admin — platform-wide access, direct to /super-admin
  if (user.role === "super_admin") {
    if (pathname === "/" || pathname.startsWith("/dashboard") || pathname === "/tenants") {
      return NextResponse.redirect(new URL("/super-admin", request.url));
    }
    return NextResponse.next();
  }

  // 6. Org-scoped users: fetch organizations and active member in parallel
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

  // GATE A: User has ZERO organizations -> MUST be on /onboarding/create-restaurant
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
  const orgRole = member?.role || "owner";

  // GATE B: User HAS 1+ organizations -> CANNOT be on /onboarding/create-restaurant
  if (userOrgs.length > 0 && isOnboarding(pathname)) {
    return NextResponse.redirect(new URL(`/dashboard/${activeSlug}`, request.url));
  }

  // 7. Role-based redirects on root or /dashboard
  if (pathname === "/" || pathname === "/dashboard") {
    if (orgRole === "staff") {
      return NextResponse.redirect(new URL(`/dashboard/${activeSlug}/orders`, request.url));
    }
    return NextResponse.redirect(new URL(`/dashboard/${activeSlug}`, request.url));
  }

  // Redirect Staff away from owner-only pages.
  if (orgRole === "staff") {
    const staffAllowed = [
      `/dashboard/${activeSlug}/orders`,
      `/dashboard/${activeSlug}/operations`,
    ];
    const isAllowed = staffAllowed.some(
      (r) => pathname === r || pathname.startsWith(r + "/")
    );
    if (!isAllowed && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL(`/dashboard/${activeSlug}/orders`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
