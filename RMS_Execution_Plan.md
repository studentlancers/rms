# RMS Execution & Connection Plan

Listen up. Splitting a Next.js App Router project rigidly into "Frontend Dev" and "Backend Dev" is a trash idea. 

You are using Next.js with Server Actions (`src/actions/`) and Prisma (`src/lib/db.ts`). This is a deeply integrated full-stack framework. If one of you writes the UI and the other writes the database queries, you will constantly block each other waiting for types, API routes, and schema updates. 

To make this bulletproof, you do not split horizontally (Front vs. Back). **You slice vertically by Feature.** You and your partner take ownership of entire modules—from the Prisma schema up to the UI components. 

Here is the real-world, battle-tested plan to connect your existing components without throwing anything away.

## Phase 1: The Core Foundation (Do This Together)
Before anyone touches a feature, you must lock down the shared infrastructure. If you don't do this together, your app will break into two incompatible halves.

1. **Prisma Schema (`prisma/schema.prisma`) Lock-in:**
   - Review your existing schema. Ensure relationships between `Restaurant`, `Menu`, `Order`, `Staff`, and `Inventory` are sound.
   - Run `npx prisma db push` or `npx prisma migrate dev` to sync the local DB.
   - *Rule:* Any future changes to the Prisma schema must be communicated. Do not push schema changes blindly.

2. **Auth & Middleware Pipeline (`src/lib/auth.ts`, `src/app/api/auth`):**
   - You have a complex auth setup with organizations and role-based access (`src/lib/require-role.ts`). 
   - Ensure the session object correctly passes the `organizationId` and `role`. Every server action relies on this to prevent data leaks between restaurants.

3. **Server Action Standards:**
   - Define a standard response wrapper for all `src/actions/*.ts`. 
   - Example: Every action must return `{ success: boolean, data?: any, error?: string }`. If you don't standardize this now, the frontend error handling will be a nightmare.

---

## Phase 2: Vertical Slicing (The Division of Labor)
Now you divide and conquer. You and your partner take ownership of specific modules. You build the server actions, and you wire them into the UI. AI can heavily accelerate the boilerplate for both.

### Developer A (e.g., You) – Operations & Execution
*Focus: Live operations, order routing, and staff interfaces.*

*   **Orders & Payments:** 
    *   *Backend:* Wire up `src/actions/orders.ts` to fetch/mutate Prisma orders. Handle Stripe/Razorpay webhooks in `src/app/api/payments/webhook/route.ts`.
    *   *Frontend:* Connect the data to `src/app/staff/orders` and `src/app/dashboard/[slug]/orders`.
*   **Kitchen & Delivery Execution:**
    *   *Backend:* Build real-time or polling mechanisms in `src/actions/delivery.ts`.
    *   *Frontend:* Wire `src/app/staff/kitchen/page.tsx` to pull active orders and mutate their status (e.g., "Prep" -> "Ready").
*   **Tables & Reservations:**
    *   *Backend:* `src/actions/tables.ts` & `reservations.ts`.
    *   *Frontend:* `src/app/staff/tables/page.tsx`.

### Developer B (e.g., Partner) – Management & Configuration
*Focus: Restaurant setup, inventory, and back-office metrics.*

*   **Menu & Inventory:**
    *   *Backend:* `src/actions/menu.ts` to handle CRUD for categories, items, and modifiers. Link inventory deductions to menu items.
    *   *Frontend:* `src/app/dashboard/[slug]/menu` and `src/app/dashboard/[slug]/inventory`. Use the existing shadcn/ui components (`src/components/ui/`) for forms.
*   **Billing & Expenses:**
    *   *Backend:* Aggregate data for financial reporting.
    *   *Frontend:* Wire up `src/app/dashboard/[slug]/billing` and `src/app/dashboard/[slug]/expenses`.
*   **Staff & Organization Management:**
    *   *Backend:* `src/actions/staff.ts` to handle invites, role assignments, and deletions.
    *   *Frontend:* Wire `src/components/auth/organization/*` components to the database.

---

## Phase 3: Handling Complications Gracefully

1. **State Management vs. Server Actions:**
   - *The Trap:* Don't try to use Redux or heavy client-side state for everything. 
   - *The Fix:* Use React's `useTransition` or Next.js `useFormState` with your Server Actions. For optimistic UI updates (e.g., marking an order as complete), use `useOptimistic`.

2. **Type Safety Across the Wire:**
   - Because you are using Server Actions, you get implicit type safety. Do not use `any`. Define Zod schemas for all your form inputs and validate them inside the Server Actions before hitting Prisma. 

3. **Database Contention during Development:**
   - If you both use the same remote database during dev, you will overwrite each other's test data.
   - *The Fix:* Use local databases (Docker + PostgreSQL or local SQLite if supported) for development. Only sync to a staging database when PRs are merged.

4. **UI Consistency:**
   - You have a design system (`src/app/design-system.css`) and Shadcn UI components.
   - *The Fix:* Strictly forbid custom CSS for layout unless absolutely necessary. Rely on Tailwind utility classes and the predefined `src/components/ui` library to ensure Developer A and Developer B produce matching interfaces.

## Final Review
Test everything. A restaurant management system cannot fail during a Friday night dinner rush. If a server action throws a 500, the UI must catch it gracefully with a toast notification (`src/components/ui/toast.tsx`), not a blank screen. Make it bulletproof.
