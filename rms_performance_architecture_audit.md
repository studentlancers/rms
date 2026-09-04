# RMS — Performance Architecture Audit (Phase 1)

**Date**: 2026-09-02  
**Target Application**: Restaurant Management System (RMS)  
**Environment**: Next.js 16.2.11 (Turbopack) / Prisma 7 / Better-Auth / Supabase PostgreSQL  

---

## Executive Summary

A comprehensive architectural audit was performed to identify the exact root causes of severe latency (8s – 49s response times) observed during development. 

The audit revealed that request latency is not caused by business computation, but rather by **multi-layer query amplification over high-latency direct database connections**:
1. **Proxy Interception**: `src/proxy.ts` executes 3 to 4 remote database queries before every single HTTP request, including internal Server Action `POST` calls and auth API routes.
2. **Duplicated Auth Resolution**: Server Actions call `requireRole()` and `getActiveRestaurantId()`, repeating the exact same queries inside the action body.
3. **Concurrent Unbatched Client Action Mounts**: Pages trigger 4–6 separate Server Actions simultaneously on mount. When combined with proxy amplification, a single page view generates 20–30 remote database queries.
4. **Aggressive Polling without Visibility Guards**: Multiple dashboard pages poll every 5 seconds without pausing when tabs are hidden or handling request overlap.
5. **Direct Unpooled Database Connection**: `DATABASE_URL` connects directly to Supabase port `5432` without a connection pooler, multiplying TLS/TCP connection overhead.

---

## 1. Expensive Request Paths Identified

| Request Path | Type | Current Measured Duration | Primary Bottleneck |
| :--- | :--- | :--- | :--- |
| `POST /dashboard/[slug]/menu` (`listCategories`) | Server Action | 8.5s – 49.0s | `proxy.ts` (40s queued) + duplicated auth + Prisma query |
| `POST /dashboard/[slug]/menu` (`listMenuItems`) | Server Action | 4.4s – 8.4s | `proxy.ts` (3.9s) + cold action execution |
| `POST /dashboard/[slug]/inventory` (`getDailyInventoryLedger`) | Server Action | 1.4s – 14.1s | `proxy.ts` + sequential ledger query across items & stock movements |
| `POST /dashboard/[slug]/inventory` (`getMonthlyInventoryLedger`) | Server Action | 1.6s – 2.3s | `proxy.ts` + monthly aggregate calculations |
| `POST /dashboard/[slug]/inventory` (`listInventoryItems`) | Server Action | 0.7s – 1.5s | `proxy.ts` + supplier join |
| `GET /api/auth/get-session` | Auth Route | 0.6s – 39.3s | `proxy.ts` intercepts auth route and queries session recursively |
| `GET /api/auth/organization/get-full-organization` | Auth Route | 1.1s – 48.0s | `proxy.ts` intercepts org query, running its own session + org queries |

---

## 2. Proxy Database & Auth Query Breakdown

**File**: `src/proxy.ts`  
**Current Route Matcher**: `matcher: ["/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"]`

On **every request matching this pattern** (including page navigation, Server Action `POST` requests, and `/api/auth/*` routes), `proxy.ts` executes:

```typescript
// 1. Session verification
const session = await auth.api.getSession({ headers: request.headers });

// 2. Organization and active membership lookup
const [orgs, activeMember] = await Promise.all([
  auth.api.listOrganizations({ headers: request.headers }),
  auth.api.getActiveMember({ headers: request.headers }),
]);

// 3. Fallback active org assignment (if active member not set)
if (!member && userOrgs.length > 0) {
  await auth.api.setActiveOrganization({ ... });
  member = await auth.api.getActiveMember({ ... });
}
```

### Flaws in Proxy Architecture:
1. **Server Actions are `POST` requests to page paths** (e.g. `POST /dashboard/the-good-resto/menu`). The proxy runs the complete tenant redirection suite on every internal action dispatch, adding 300ms–40s of overhead before the action code is even reached.
2. **Auth API routes** (`/api/auth/*`) are public or self-handling, yet `proxy.ts` calls `getSession()` before letting Better-Auth handle `/api/auth/get-session`.

---

## 3. Duplicated Auth Queries in Server Actions

**File**: `src/lib/require-role.ts`

In almost every Server Action in `src/actions/*`:
```typescript
export async function listInventoryItems(categoryId?: string) {
  await requireRole(["owner", "admin", "staff"]); // Calls getRestaurantContext() -> getSession() + getActiveMember()
  const restaurantId = await getActiveRestaurantId(); // Calls getRestaurantContext() AGAIN -> getSession() + getActiveMember()
  ...
}
```

### Redundancy Chain:
1. `proxy.ts` calls `auth.api.getSession` (DB query #1)
2. `proxy.ts` calls `auth.api.getActiveMember` (DB query #2)
3. Action calls `requireRole()` $\rightarrow$ `getRestaurantContext()` $\rightarrow$ `getSession()` (DB query #3)
4. `getRestaurantContext()` calls `getActiveMember()` (DB query #4)
5. Action calls `getActiveRestaurantId()` $\rightarrow$ `getRestaurantContext()` $\rightarrow$ `getSession()` (DB query #5)
6. `getRestaurantContext()` calls `getActiveMember()` (DB query #6)
7. Action runs actual business Prisma query (DB query #7)

**Total DB round trips for 1 action**: 6 auth queries + 1 business query.  
When a page calls 4 actions concurrently, **24 auth queries hit Supabase at the exact same moment**.

---

## 4. Pages Firing Multiple Unbatched Server Actions on Mount

| Page | Initial Server Action Calls on Mount | Sequential/Parallel |
| :--- | :--- | :--- |
| `src/app/dashboard/[slug]/page.tsx` | `getDailySales({ from, to })` + `listNotifications()` | Parallel |
| `src/app/dashboard/[slug]/menu/page.tsx` | `listCategories()`, `listMenuItems()`, `listInventoryItems()`, `listNotifications()` | Parallel |
| `src/app/dashboard/[slug]/inventory/page.tsx` | `listInventoryItems()`, `getInventoryStats()`, followed sequentially by `getDailyInventoryLedger()`, `getMonthlyInventoryLedger()`, `listNotifications()` | Mixed (Waterfall) |
| `src/app/dashboard/[slug]/billing/page.tsx` | `listOrders()`, `listMenuItems()`, `listTables()`, `listNotifications()` | Parallel |
| `src/app/dashboard/[slug]/staff/page.tsx` | `listStaffMembers()`, `listAttendance()`, `listShifts()`, `listPayroll()`, `listNotifications()` | Parallel |
| `src/app/dashboard/[slug]/expenses/page.tsx` | `listExpenses()`, `getExpenseStats()`, `listSuppliers()`, `listStaffMembers()`, `listNotifications()` | Parallel |
| `src/app/staff/page.tsx` | `listOrders()`, `listTables()`, `listNotifications()` | Parallel |
| `src/app/staff/orders/page.tsx` | `listOrders()`, `listMenuItems()`, `listTables()` | Parallel |
| `src/app/staff/kitchen/page.tsx` | `listActiveOrders()` | Single |
| `src/app/staff/tables/page.tsx` | `listTables()`, `listActiveOrders()` | Parallel |

---

## 5. Polling Intervals & Concurrency Audit

| Component / Page | Interval | Purpose | Criticality | Missing Guard |
| :--- | :--- | :--- | :--- | :--- |
| `src/components/layout/header.tsx` | 10s | Unread notifications count | Medium | Missing `document.visibilityState` check |
| `src/app/dashboard/[slug]/page.tsx` | 5s | Live sales & covers | Low | Unnecessary 5s interval for overview |
| `src/app/dashboard/[slug]/billing/page.tsx` | 5s | POS billing order stream | Medium | Overlapping fetch possible |
| `src/app/dashboard/[slug]/inventory/page.tsx` | 15s | Stock ledger & stats | Low | Runs full 4-query waterfall every 15s |
| `src/app/dashboard/[slug]/expenses/page.tsx` | 10s | Expense records | Low | Non-critical for rapid polling |
| `src/app/dashboard/[slug]/reports/page.tsx` | 15s | Aggregated reporting | Low | Non-critical for rapid polling |
| `src/app/dashboard/[slug]/staff/page.tsx` | 10s | Staff attendance/roster | Low | Non-critical for rapid polling |
| `src/app/dashboard/[slug]/delivery/page.tsx` | 5s | Rider & dispatch tracking | High | Keep 5s–8s with visibility guard |
| `src/app/staff/kitchen/page.tsx` | 5s | Kitchen Display System (KDS) | High | Keep 5s with concurrency ref |
| `src/app/staff/orders/page.tsx` | 5s | POS live order board | High | Keep 5s with concurrency ref |
| `src/app/staff/tables/page.tsx` | 5s | Live floor plan table states | High | Keep 5s with concurrency ref |

---

## 6. Database Connection Configuration Audit

**File**: `.env`  
**Configuration**:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.qksryuayxhgokbfvxzqy.supabase.co:5432/postgres"
```
**File**: `src/lib/db.ts`  
Using `@prisma/adapter-pg` with `pg` client over standard direct TCP.

### Critical Database Finding:
- `db.qksryuayxhgokbfvxzqy.supabase.co:5432` connects to the direct PostgreSQL instance.
- Direct port `5432` creates a new physical backend process or TLS handshake per connection.
- In Supabase, the **Transaction Connection Pooler** (Supavisor on port `6543`) maintains warm persistent database connections, drastically reducing connection latency and preventing connection starvation.

---

## 7. Recommended Optimizations Plan

### A. Proxy Optimization (`src/proxy.ts`)
1. Skip deep database queries (`auth.api.listOrganizations`, `auth.api.getActiveMember`) for:
   - Server Action requests (detectable via `request.headers.get("next-action")` or `request.method === "POST"` to page routes).
   - Public and API routes (`/api/auth/*`, `/api/payments/*`).
2. Only run tenant slug validation and redirection on full page navigation (`GET` requests to browser routes).
3. Check session cookie validity efficiently without blocking downstream requests.

### B. Auth Context Deduplication (`src/lib/require-role.ts`)
1. Wrap `getRestaurantContext()`, `getSession()`, and `getActiveRestaurantId()` with React `cache()` from `"react"`. In React Server Components & Server Actions, `cache()` deduplicates calls per request lifecycle, ensuring each query executes at most once per action request.
2. In `getActiveRestaurantId(existingCtx)`, immediately return `existingCtx.restaurantId` if context is already provided.
3. Update server actions to reuse `const ctx = await requireRole(...)` and pass `ctx` to `getActiveRestaurantId(ctx)` instead of calling it separately.

### C. Polling & Performance Guards
1. Implement global tab visibility checks (`document.visibilityState === "visible"`) across all polling `setInterval` hooks.
2. Add `isFetchingRef` concurrency guards to prevent overlapping requests when network round trips take longer than the interval.
3. Relax non-critical polling intervals (Expenses, Reports, Staff, Inventory: 30s–60s or manual refresh; Kitchen, POS Orders, Tables: 5s–8s with guards).

### D. Server Action Batching & Query Optimization
1. Combine dependent queries in `inventory/page.tsx` so daily and monthly ledgers are not fetched sequentially after stats.
2. Add Prisma `select` projections where only specific fields are needed.

---

## 8. Security Impact Assessment

| Security Requirement | Status After Proposed Optimization |
| :--- | :--- |
| **Authentication Enforcement** | Fully preserved. Proxy continues to redirect unauthenticated users to `/login`. Every Server Action independently enforces `requireRole()`. |
| **Tenant Isolation** | Fully preserved. Every Server Action resolves `restaurantId` strictly from the authenticated user's active organization membership in `requireRole()`. |
| **Role-Based Access Control (RBAC)** | Fully preserved. Staff, Owner, Admin, and Super Admin permissions are strictly validated in both proxy (navigation) and actions (execution). |
| **Staff Isolation** | Fully preserved. Staff routing restrictions (`/staff/*` only) remain enforced in `proxy.ts` on page loads and in all `requireRole()` gates. |

---

## 9. Expected Performance Impact

| Metric | Before Optimization | Expected After Optimization |
| :--- | :--- | :--- |
| Proxy overhead on Server Actions | 400ms – 40,000ms | **< 2ms** (bypassed for internal action posts) |
| Auth queries per Server Action | 6 queries | **1 query** (cached per request lifecycle) |
| Total DB queries on page load | 20 – 30 queries | **3 – 5 queries** |
| Average Action Execution Time | 2,000ms – 14,000ms | **200ms – 600ms** |
| Background Tab CPU & Network Usage | Continuous 5s polling | **0 requests when tab is hidden** |
