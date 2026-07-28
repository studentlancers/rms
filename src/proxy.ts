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

  // 4. Super Admin — platform-wide access, skip org checks entirely.
  if (user.role === "super_admin") {
    if (pathname === "/" || pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/tenants", request.url));
    }
    return NextResponse.next();
  }

  // 5. Org-scoped users: check organization count
  let userOrgs: Array<{ id: string; name: string; slug: string }> = [];
  try {
    const orgs = await auth.api.listOrganizations({
      headers: request.headers,
    });
    if (Array.isArray(orgs)) {
      userOrgs = orgs;
    }
  } catch {
    // If listing fails, treat as empty
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

  // Ensure active organization is set on session
  let member: { role: string; organizationId: string } | null = null;
  try {
    member = await auth.api.getActiveMember({
      headers: request.headers,
    });

    if (!member && userOrgs.length > 0) {
      await auth.api.setActiveOrganization({
        body: { organizationId: userOrgs[0].id },
        headers: request.headers,
      });
      member = await auth.api.getActiveMember({
        headers: request.headers,
      });
    }
  } catch {
    // Ignore active member resolution errors
  }

  const activeOrg = userOrgs.find((o) => o.id === member?.organizationId) || userOrgs[0];
  const activeSlug = activeOrg?.slug || "restaurant";
  const orgRole = member?.role || "owner";

  // GATE B: User HAS 1+ organizations -> CANNOT be on /onboarding/create-restaurant
  if (userOrgs.length > 0 && isOnboarding(pathname)) {
    return NextResponse.redirect(new URL(`/dashboard/${activeSlug}`, request.url));
  }

  // 6. Role-based redirects on root or /dashboard
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
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
