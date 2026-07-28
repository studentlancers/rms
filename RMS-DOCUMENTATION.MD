# Restaurant Management System — Technical Documentation

**Project:** HMS — Internal Restaurant Operations Platform
**Stack:** Next.js 16 (App Router) · PostgreSQL (local, `rms`) · Prisma · Better Auth · RazorPay · Gemini API
**Scope:** Internal-only. No customer/public-facing app — this system is exclusively for a restaurant's own staff to manage their internals.
**Status:** Living document — build on this as phases progress

> **Last updated:** Ownership model clarified — Owners self-provision their own restaurants via an onboarding gate. Super Admin does not create restaurants; they view and manage existing ones only.

---

## 1. System Overview

HMS is a multi-tenant SaaS platform that lets multiple restaurants run their internal operations — order handling, delivery dispatch, menu, tables, staff, and analytics — from one codebase, with strict data isolation per tenant (restaurant).

There is no customer-facing storefront, ordering app, or public account type in this system. Every screen sits behind authenticated, role-gated access for restaurant staff only.

### 1.1 Roles

| Role | Scope | Description |
|---|---|---|
| **Super Admin** | Platform-wide | Platform observer and manager. Can view all restaurants, suspend/reinstate them, and access platform-wide analytics. **Cannot create restaurants** — restaurant creation is always owner-initiated. |
| **Owner** | Single restaurant, full control | Signs up independently and **creates their own restaurant** during onboarding. Full control of their restaurant — staff, menu, tables, analytics, settings, payouts. Must have at least one restaurant to access any feature. |
| **Admin** | Single restaurant, operational + config | Day-to-day operational control — orders, delivery, menu, tables — without staff management or billing/settings access. |
| **Staff** | Single restaurant, front-line only | Operational access only — order board, delivery board, table status. No dashboard analytics, no configuration screens. |

There is intentionally no "Customer" role. If a customer-facing ordering flow is ever needed, it should be treated as a **separate, clearly bounded app** with its own auth flow — not bolted onto this internal system.

### 1.3a Owner Onboarding Gate

Any authenticated user with the `owner` role (or no org role at all — i.e. a brand-new sign-up) who has **zero Better Auth organizations** is intercepted by middleware on every request and redirected to `/onboarding/create-restaurant`. They cannot access any operational screen until they complete restaurant creation. This is enforced server-side in middleware, not just in the UI.

- **Admins and Staff** are never in this state — they arrive via an invitation from an Owner, which already ties them to an existing organization.
- **Super Admin** is exempt from the gate — their access is platform-wide and not org-scoped.

### 1.2 Role → Access Matrix

| Area | Super Admin | Owner | Admin | Staff |
|---|:---:|:---:|:---:|:---:|
| Tenants (platform mgmt) | ✅ | — | — | — |
| Dashboard | ✅ | ✅ | ✅ | — |
| Order Management | ✅ | ✅ | ✅ | ✅ |
| Delivery Management | ✅ | ✅ | ✅ | ✅ |
| Menu & Items | ✅ | ✅ | ✅ | — |
| Tables & Reservations | ✅ | ✅ | ✅ | ✅ |
| Staff Management | ✅ | ✅ | — | — |
| Analytics | ✅ | ✅ | — | — |
| Settings | ✅ | ✅ | — | — |

### 1.4 Multi-Tenancy Model

- **Tenant = Restaurant, and Restaurant = a Better Auth Organization.** We use Better Auth's built-in [Organization plugin](https://www.better-auth.com/docs/plugins/organization) as the tenant model instead of a hand-rolled `restaurants` table — no custom tenant field to maintain.
- Everywhere Better Auth's docs/API say "organization," this product renames it to **"Restaurant"** — in the UI copy, route names, and our own wrapper functions. Under the hood it's still `organization`/`member`/`invitation` from the plugin; we don't fork the plugin, just relabel it at the presentation layer.
- Better Auth's `organization` plugin already provides: organization CRUD, membership, invitations, and per-organization custom roles — this replaces the custom `restaurants` and `staff` tables from the previous schema draft.
- **Roles map onto Better Auth org roles:** `owner`, `admin`, and `staff` are configured as the organization's custom roles (via the plugin's access-control config). `restaurantId` in our own tables refers to the Better Auth `organizationId`.
- **Super Admin is platform-wide, not an org role** — it's handled via Better Auth's separate [Admin plugin](https://www.better-auth.com/docs/plugins/admin) (a `user.role` flag), since Super Admin isn't scoped to any one Restaurant.
- Isolation strategy: **shared database, tenant-scoped rows** — every domain table (menu, orders, deliveries, etc.) still carries an `organizationId`/`restaurantId` column and is filtered by it.
- Every server action/route handler that touches tenant data must resolve the active organization membership through Better Auth (`auth.api.getActiveMember` or equivalent) — never trust a client-supplied `restaurantId` at face value.
- No public routing/storefront layer is needed — all routes sit behind auth.

---

## 2. Tech Stack Rationale

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router | Server Components, streaming, co-located API routes where needed |
| Backend/DB | PostgreSQL (local db: `rms`) + Prisma | Familiar relational model, strong typing via generated Prisma Client, easy local dev with a single local Postgres instance |
| Auth | Better Auth | Role/session handling, already used across your other projects |
| Payments | RazorPay | India-first payment gateway, webhook support for order confirmation |
| AI | Gemini API | Menu description generation, demand forecasting |
| Styling | Tailwind CSS + custom design tokens + shadcn/ui (Base UI) | Consistent with your other projects |

---

## 3. Data Model (Prisma Schema)

> **Note:** Restaurants, memberships, and roles are **not** modeled in our own tables — they live in Better Auth's own `organization` (→ "Restaurant"), `member`, and `invitation` tables, managed via the Better Auth Prisma adapter against the same local Postgres database (`rms`). The schema below only covers domain data that Better Auth doesn't own. Every table references the Better Auth organization by its id, stored here as `restaurantId String` (a plain string/foreign key by convention, not a Prisma relation into Better Auth's own tables).

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // local Postgres database named "rms"
}

model Category {
  id           String   @id @default(cuid())
  restaurantId String   // Better Auth organizationId
  name         String
  sortOrder    Int
  menuItems    MenuItem[]

  @@index([restaurantId])
}

model MenuItem {
  id            String   @id @default(cuid())
  restaurantId  String   // Better Auth organizationId
  categoryId    String
  category      Category @relation(fields: [categoryId], references: [id])
  name          String
  description   String?
  price         Float
  isVeg         Boolean
  isAvailable   Boolean  @default(true)
  variants      Json?    // [{ name, priceModifier }]

  @@index([restaurantId])
  @@index([categoryId])
}

model Table {
  id           String   @id @default(cuid())
  restaurantId String   // Better Auth organizationId
  tableNumber  String
  capacity     Int
  status       TableStatus @default(FREE)
  orders       Order[]
  reservations Reservation[]

  @@index([restaurantId])
}

enum TableStatus {
  FREE
  OCCUPIED
  RESERVED
}

model Order {
  id                String      @id @default(cuid())
  restaurantId      String      // Better Auth organizationId
  tableId           String?
  table             Table?      @relation(fields: [tableId], references: [id])
  createdByUserId   String      // Better Auth user id — orders are entered by staff, not customers
  orderType         OrderType
  status            OrderStatus @default(PENDING)
  items             Json        // [{ menuItemId, name, quantity, unitPrice, variant?, notes? }]
  subtotal          Float
  tax               Float
  total             Float
  paymentStatus     PaymentStatus @default(PENDING)
  razorpayOrderId   String?
  razorpayPaymentId String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  delivery          Delivery?

  @@index([restaurantId])
  @@index([restaurantId, status])
  @@index([tableId])
}

enum OrderType {
  DINE_IN
  TAKEAWAY
  DELIVERY
}

enum OrderStatus {
  PENDING
  PREPARING
  READY
  SERVED
  OUT_FOR_DELIVERY
  COMPLETED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

model Delivery {
  id           String         @id @default(cuid())
  restaurantId String         // Better Auth organizationId
  orderId      String         @unique
  order        Order          @relation(fields: [orderId], references: [id])
  riderUserId  String         // Better Auth user id of the staff member riding
  status       DeliveryStatus @default(ASSIGNED)
  etaMinutes   Int?
  createdAt    DateTime       @default(now())
  deliveredAt  DateTime?

  @@index([restaurantId])
}

enum DeliveryStatus {
  ASSIGNED
  IN_TRANSIT
  NEARBY
  DELIVERED
}

model Reservation {
  id               String            @id @default(cuid())
  restaurantId     String            // Better Auth organizationId
  customerName     String
  customerPhone    String
  partySize        Int
  reservationTime  DateTime
  tableId          String?
  table            Table?            @relation(fields: [tableId], references: [id])
  status           ReservationStatus @default(PENDING)
  takenByUserId    String            // Better Auth user id — reservation logged by staff (phone/walk-in), not self-booked

  @@index([restaurantId])
}

enum ReservationStatus {
  PENDING
  CONFIRMED
  SEATED
  CANCELLED
  NO_SHOW
}
```

---

## 4. Auth Model (Better Auth)

### 4.1 Plugins in Use

- **[Organization plugin](https://www.better-auth.com/docs/plugins/organization)** — provides `organization` (→ "Restaurant"), `member`, and `invitation` under the hood. Configured with three custom access-control roles: `owner`, `admin`, `staff`.
- **[Admin plugin](https://www.better-auth.com/docs/plugins/admin)** — provides the platform-level `user.role` flag used for **Super Admin**. Super Admin is deliberately kept out of the organization/member model since it isn't scoped to a single Restaurant.

### 4.2 Session Structure

- Better Auth session carries `userId`, `email`, and (via the Admin plugin) a top-level `role` field that is either unset or `"super_admin"`.
- The organization plugin tracks an **active organization** on the session (`activeOrganizationId`) — i.e. which Restaurant the signed-in staff member is currently operating in.
- Two lookup paths on every authenticated request:
  1. **Platform check:** does `user.role === "super_admin"`? → platform-wide access, no organization scoping needed.
  2. **Restaurant check:** resolve the caller's membership for the active organization via `auth.api.getActiveMember()` (or `organization.getFullOrganization`) → gives back their org role (`owner` | `admin` | `staff`) scoped to that Restaurant.
- A single user could belong to more than one Restaurant (e.g. a consultant) as separate Better Auth memberships — the active organization on the session determines which one is "current," and every server call re-resolves against it rather than caching a role globally.
- Recommended server-side helper: `getRestaurantContext()` — reads the session, resolves the active organization + member role via Better Auth, throws/redirects if no active membership exists.

### 4.3 Auth Flows

- Email/password + optional OTP for all staff roles (Owner, Admin, Staff, Super Admin).
- **Owner self-signup:** Owners register independently via `/signin`. Immediately after their first login, the middleware detects zero organizations and hard-redirects to `/onboarding/create-restaurant`. The owner names their restaurant; a Better Auth organization is created with them as the `owner` member. They cannot skip this step.
- **Admin/Staff onboarding:** Owners use the organization plugin's invite flow (`auth.api.createInvitation`) for their own Admins/Staff. Invited users receive an email, accept via the invite link, and are automatically tied to that restaurant — they never hit the onboarding gate.
- **Super Admin provisioning:** Super Admin accounts are created by setting `user.role = "super_admin"` directly in the database (or via a seeding script). There is no self-signup path for Super Admin.
- No public registration flow exists beyond the owner sign-up, since there is no customer-facing side.
- **Role-based redirect after login:**
  - Super Admin → `/tenants`
  - Owner/Admin (with an active org) → `/owner`
  - Staff → `/owner/orders`
  - Owner with no org → `/onboarding/create-restaurant`

### 4.4 Enforcement Notes

- Role checks must be enforced **server-side**, in every Server Action / Route Handler that touches data — never rely on hiding UI elements alone.
- A UI-only "preview as role" switcher (useful for design/QA) is not a substitute for real gating and must never ship to production without the corresponding server-side check below.

```ts
// lib/require-role.ts — delegates role resolution to Better Auth
// instead of querying a custom `staff` table. Call this at the top
// of any Server Action or Route Handler before touching Prisma.
export async function requireRole(allowed: Array<"owner" | "admin" | "staff">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  // Super Admin (Admin plugin) bypasses org-scoped role checks entirely.
  if (session.user.role === "super_admin") return { role: "super_admin" as const };

  const member = await auth.api.getActiveMember({ headers: await headers() });
  if (!member || !allowed.includes(member.role)) {
    throw new Error("Not authorized for this action");
  }
  return member;
}
```

---

## 5. API Reference (Server Actions / Route Handlers, backed by Prisma)

### 5.1 Restaurants — Better Auth Organization API
These are Better Auth's own organization endpoints, called through `auth.api.*` — not custom application functions. Renamed to "Restaurant" in any UI copy.

| Better Auth call | Purpose | Access |
|---|---|---|
| `auth.api.createOrganization({ name, slug, ... })` | **Owner** creates their own Restaurant during onboarding | **owner** (self-provisioning during onboarding) |
| `auth.api.listOrganizations()` | List all Restaurants on the platform | super_admin |
| `auth.api.updateOrganization({ organizationId, data })` | Edit a Restaurant's details, or suspend/reinstate via a custom metadata flag | super_admin (platform management), owner (their own restaurant only) |
| `auth.api.deleteOrganization({ organizationId })` | Delete a Restaurant and all its data | super_admin |

> **Note:** Super Admin cannot call `createOrganization` to provision a restaurant on an owner's behalf. Restaurant creation is exclusively owner-initiated from the onboarding gate.

### 5.2 Restaurant Members (Staff) — Better Auth Organization API
| Better Auth call | Purpose | Access |
|---|---|---|
| `auth.api.createInvitation({ organizationId, email, role })` | Invite an Admin/Staff member to the Restaurant | owner only (admin/staff roles) |
| `auth.api.listMembers({ organizationId })` | List members of a Restaurant | owner, admin |
| `auth.api.updateMemberRole({ memberId, role })` | Change a member's role | owner |
| `auth.api.removeMember({ memberId })` | Remove/deactivate a member | owner |

### 5.3 Menu
| Function | Type | Args | Access |
|---|---|---|---|
| `menu.listItems` | Server Action (read) | `{ restaurantId, categoryId? }` | owner, admin, staff |
| `menu.createItem` | Server Action (write) | `{ restaurantId, categoryId, name, price, ... }` | owner, admin |
| `menu.toggleAvailability` | Server Action (write) | `{ menuItemId, isAvailable }` | owner, admin, staff |

### 5.4 Orders
| Function | Type | Args | Access |
|---|---|---|---|
| `orders.create` | Server Action (write) | `{ restaurantId, tableId?, orderType, items }` | owner, admin, staff (entered on behalf of a dine-in/phone/walk-in customer) |
| `orders.updateStatus` | Server Action (write) | `{ orderId, status }` | owner, admin, staff (role-checked per transition) |
| `orders.listLive` | Server Action (read) | `{ restaurantId }` → non-completed orders, refreshed via polling or SSE (see note below) | owner, admin, staff |
| `orders.confirmPayment` | Server Action (write) | `{ orderId, razorpayPaymentId, razorpaySignature }` | server-side webhook only |

### 5.5 Delivery
| Function | Type | Args | Access |
|---|---|---|---|
| `deliveries.assign` | Server Action (write) | `{ orderId, riderUserId }` | owner, admin |
| `deliveries.updateStatus` | Server Action (write) | `{ deliveryId, status, etaMinutes? }` | owner, admin, staff (rider) |
| `deliveries.listActive` | Server Action (read) | `{ restaurantId }`, refreshed via polling or SSE (see note below) | owner, admin, staff |

### 5.6 Payments (RazorPay)
| Endpoint | Type | Purpose |
|---|---|---|
| `POST /api/payments/create-order` | Route Handler | Creates a RazorPay order for an in-house-entered order |
| `POST /api/payments/webhook` | Route Handler | Verifies RazorPay webhook signature, calls `orders.confirmPayment` |

### 5.7 Tables & Reservations
| Function | Type | Args | Access |
|---|---|---|---|
| `tables.list` | Server Action (read) | `{ restaurantId }` | owner, admin, staff |
| `tables.updateStatus` | Server Action (write) | `{ tableId, status }` | owner, admin, staff |
| `reservations.create` | Server Action (write) | `{ restaurantId, customerName, phone, partySize, time }` | owner, admin, staff (logged from phone/walk-in) |
| `reservations.confirm` | Server Action (write) | `{ reservationId, tableId }` | owner, admin, staff |

### 5.8 Analytics
| Function | Type | Args | Access |
|---|---|---|---|
| `analytics.dailySales` | Server Action (read) | `{ restaurantId, dateRange }` | owner |
| `analytics.topItems` | Server Action (read) | `{ restaurantId, dateRange, limit }` | owner |
| `analytics.platformOverview` | Server Action (read) | `{}` | super_admin |

> **Real-time note:** the previous Convex-based draft got live order/delivery boards for free via Convex's reactive queries. Plain Postgres + Prisma doesn't provide that out of the box — `orders.listLive` and `deliveries.listActive` will need either short-interval polling, a Postgres `LISTEN/NOTIFY` + SSE route, or a small realtime layer (e.g. Pusher/Ably) if a live-updating board is required. Flagged in Open Decisions below.

---

## 6. Environment Variables

```env
# Database (local Postgres, database name: rms)
DATABASE_URL="postgresql://postgres:password@localhost:5432/rms"

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# RazorPay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Gemini
GEMINI_API_KEY=

# Misc
NEXT_PUBLIC_APP_URL=
```

---

## 7. Build Roadmap

1. **Foundation** — Next.js 16 project setup, local Postgres database (`rms`) + Prisma init/migrations, Better Auth wiring with the Organization plugin (roles: `owner`/`admin`/`staff`) and Admin plugin (Super Admin), domain schema for menu/orders/deliveries/reservations, `requireRole` / `getRestaurantContext` helpers, middleware for auth + restaurant gate.
2. **Owner Onboarding** — `/onboarding/create-restaurant` flow: Owner signs up → middleware gate → creates their own Better Auth organization → lands on `/owner`. Owner invite flow for Admin/Staff via the organization plugin's invitations.
3. **Menu Management** — categories, items, variants, availability toggling.
4. **Order Management** — order entry by staff, live order board (polling initially), status transitions.
5. **Delivery Management** — rider assignment, live delivery tracking (polling initially), status updates.
6. **Payments** — RazorPay integration, webhook handling, refunds.
7. **Tables & Reservations** — table status board, phone/walk-in reservation logging.
8. **Staff & Access Control** — role management UI, deactivation, audit trail of role changes.
9. **Analytics & Super Admin Console** — Owner-level reporting (analytics inaccessible to Admin/Staff), platform-wide Super Admin dashboard with restaurant list, suspension controls.

---

## 8. Security & Isolation Checklist

- [ ] Every Server Action/Route Handler resolves role via Better Auth (`getActiveMember` for org roles, `user.role` for Super Admin) server-side — never trust a client-supplied role or `restaurantId`.
- [ ] No route or function assumes a "customer" identity anywhere — orders/reservations are always attributed to the Better Auth user id of the staff member who entered them.
- [ ] RazorPay webhook signature verified server-side before any payment state changes.
- [ ] Role transitions on `orders.updateStatus` / `deliveries.updateStatus` are validated against allowed transitions.
- [ ] Owner-only actions (`updateMemberRole`, `removeMember`) cannot be called by Admin or Staff even if they know the endpoint.
- [ ] Super Admin actions (Restaurant/organization provisioning) are fully separated from org-scoped member checks.

---

## 9. Open Decisions / To Revisit

- **Realtime strategy for live boards** — Currently using **short-interval polling** (simplest, no extra dependencies). Future options: Postgres `LISTEN/NOTIFY` + Server-Sent Events, or a hosted realtime service (Pusher/Ably) for the order board and delivery tracker. Decision deferred to Phase 4.
- Whether a future customer-facing ordering flow is added as a **separate app** with its own auth, rather than extending this internal system. ✅ Direction confirmed: separate app.
- Delivery logistics scope — is rider GPS tracking live, or manual status updates only, for v1. **Default: manual status updates for v1.**
- Whether Admin should have partial Analytics access (e.g. today's numbers only) rather than none. **Default: no analytics for Admin.** Revisit post-launch.
- **Multi-restaurant owners** — An owner could theoretically create more than one restaurant (Better Auth allows multiple orgs per user). The active org determines context. A restaurant switcher in the UI may be needed if this is a real use case.

---

## 10. Route Map

| Route | Access | Description |
|---|---|---|
| `/` | — | Redirects based on auth state |
| `/signin` | Public | Email/password sign-in |
| `/onboarding/create-restaurant` | Owner with 0 orgs | Mandatory restaurant creation gate |
| `/owner` | Owner, Admin | Dashboard overview |
| `/owner/orders` | Owner, Admin, Staff | Live order board |
| `/owner/operations` | Owner, Admin, Staff | Tables & reservations |
| `/owner/menu` | Owner, Admin | Menu & category management |
| `/owner/staff` | Owner | Staff management & invitations |
| `/owner/reports` | Owner | Analytics & reporting |
| `/owner/settings` | Owner | Restaurant settings |
| `/tenants` | Super Admin | Platform-wide restaurant list & controls |
| `/api/auth/[...all]` | — | Better Auth catch-all handler |
| `/api/payments/create-order` | Server | RazorPay order creation |
| `/api/payments/webhook` | Server | RazorPay webhook (signature-verified) |

---

*This document is meant to evolve — update the API reference table as each Server Action is actually implemented, and check off the security checklist per phase.*