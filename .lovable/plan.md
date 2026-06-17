# Apple Store — Refactoring, Optimization & Error-Handling Plan

A staged plan to harden the codebase without changing user-facing features. Each phase is independently shippable; nothing breaks if a phase is paused.

---

## Phase 0 — Foundation (shared utilities)

Create a small set of primitives that every later phase depends on.

1. `src/lib/validation.ts` — Zod schemas for every entity used in forms (product, sale, customer, supplier, investment entry, due payment, branding settings, user). Centralizes max-lengths, IMEI = exactly 15 digits, phone regex, non-negative numeric guards, currency precision.
2. `src/lib/errors.ts` — `toUserMessage(error)` mapper that converts Supabase / Postgres / network errors into friendly Bengali strings (e.g. `23505 → "এই IMEI ইতিমধ্যে ব্যবহৃত হয়েছে"`, `23503 → "সম্পর্কিত রেকর্ড পাওয়া যায়নি"`, `PGRST116 → "ডাটা পাওয়া যায়নি"`, network → "ইন্টারনেট সংযোগ চেক করুন").
3. `src/components/ErrorBoundary.tsx` — top-level boundary wrapping `<Routes>` in `App.tsx` with a Bengali fallback UI and a "পুনরায় চেষ্টা করুন" button.
4. `src/lib/queryClient.ts` — extract the singleton `QueryClient` from `App.tsx`, configure global defaults: `retry: 2`, `staleTime: 30s`, `refetchOnWindowFocus: false`, and a `QueryCache` `onError` that surfaces `toast.error(toUserMessage(err))` for read failures.
5. `src/lib/logger.ts` — thin wrapper around `console` that strips sensitive fields (password, token, IMEI, phone) so we never leak PII to the replay/console pipeline.

---

## Phase 1 — Critical bug & data-integrity fixes

Fix issues that already affect users today.

1. POS stock race condition (`src/components/POS.tsx`): replace the per-item read-then-write loop with a single Postgres RPC `complete_sale(sale_payload jsonb)` that:
   - inserts the sale row,
   - inserts every sale_item,
   - decrements stock atomically with `UPDATE products SET stock_quantity = stock_quantity - $qty WHERE id = $id AND stock_quantity >= $qty RETURNING id`,
   - rolls back the whole transaction if any item fails (oversell, missing product).
   The client wraps the RPC call in try/catch and shows a friendly message ("স্টক অপ্রতুল" vs "বিক্রয় সম্পন্ন করতে ব্যর্থ").
2. Due-payment race (`src/components/DueCollection.tsx`): same pattern — RPC `collect_due(sale_id, amount, method, notes)` that validates `amount <= due_amount` server-side and inserts + updates in one transaction.
3. Cart input guards: block negative quantity, NaN custom price, and price > 10× cost without confirmation (extends the existing 3× warning).
4. IMEI uniqueness: add a partial unique index `(imei) WHERE stock_quantity > 0` so the "reentry allowed if stock = 0" rule is enforced in the DB, not just the UI.

---

## Phase 2 — Component decomposition

Break the three largest files into focused units. No behavior changes.

```text
Products.tsx (~800 lines)        →  products/
                                      ProductList.tsx
                                      ProductForm.tsx
                                      ProductFilters.tsx
                                      ProductCard.tsx
                                      hooks/useProducts.ts
                                      hooks/useProductMutations.ts

Investments.tsx (~500 lines)     →  investments/
                                      SectorList.tsx
                                      EntryDialog.tsx
                                      IncomeDialog.tsx
                                      SectorSummary.tsx
                                      hooks/useInvestments.ts

Sales.tsx                        →  sales/
                                      SalesTable.tsx
                                      SalesFilters.tsx
                                      SaleDetailDrawer.tsx
                                      hooks/useSales.ts
```

Each new file stays under ~250 lines. React-Query keys move into one `src/lib/queryKeys.ts` to prevent invalidation typos.

---

## Phase 3 — Form layer with validated inputs

Adopt `react-hook-form` + zod resolvers for every create/edit dialog: Products, Customers, Suppliers, Categories, Investment Sectors/Entries/Incomes, Branding, User Management. Each form gets:

- Per-field Bengali error messages from the zod schema.
- `disabled` submit until valid.
- A single `onSubmit` try/catch that funnels to `toUserMessage`.
- Optimistic UI for low-risk mutations (rename category, toggle active) with rollback on error.

---

## Phase 4 — Network & mutation hardening

1. Wrap every `useMutation` in a shared `useSafeMutation` hook that:
   - adds `onError → toast.error(toUserMessage(err))` so individual screens don't have to,
   - logs a sanitized error via `logger`,
   - rolls back optimistic cache updates.
2. Add an offline detector (`navigator.onLine` + `online`/`offline` listeners) that shows a sticky banner "ইন্টারনেট সংযোগ নেই — পরিবর্তন সংরক্ষণ হবে না" and disables write buttons.
3. PDF/Excel exports (Returns, Sales, Investments, Staff Performance) wrap their generation in try/catch with a fallback toast instead of a blank screen on failure.
4. Barcode scanner: catch camera-permission denial and show a Bengali instruction toast.

---

## Phase 5 — Performance

1. Virtualize Products grid and Sales table with `@tanstack/react-virtual` when row count > 100.
2. Add DB indexes via migration: `sales(created_at desc)`, `sales(customer_id)`, `sale_items(sale_id)`, `products(barcode)`, `products(imei) where stock_quantity > 0`, `activity_logs(user_id, created_at desc)`, `due_payments(sale_id)`.
3. Replace `select("*")` with explicit column lists on hot paths (POS product list, Dashboard widgets).
4. Code-split heavy routes with `React.lazy`: `Reports`, `StaffPerformanceReport`, `Investments`, `ActivityLog`, `UserManagement` — keeping POS/Dashboard in the main bundle for fast startup.
5. Memoize expensive derivations in `Dashboard.tsx` and `Reports.tsx` with `useMemo` keyed on the source arrays.

---

## Phase 6 — Security review

1. Re-run Supabase linter; ensure every public table has RLS + grants matching the role matrix (Admin / Manager / Staff).
2. Move all admin-only checks to a server-side `is_admin(auth.uid())` policy reference instead of relying on the client.
3. Sanitize any field rendered with `dangerouslySetInnerHTML` (currently none, but add an ESLint rule to forbid it).
4. Tighten the `branding` storage bucket: 5 MB max, MIME whitelist (`image/png`, `image/jpeg`, `image/svg+xml`, `image/webp`, `image/x-icon`).

---

## Phase 7 — Developer experience & guardrails

1. Replace remaining `any` types with generated Supabase row types (`Database["public"]["Tables"]["…"]["Row"]`).
2. Enable stricter ESLint: `no-floating-promises`, `no-misused-promises`, `react-hooks/exhaustive-deps` as error.
3. Add Vitest with smoke tests for: `toUserMessage`, validation schemas, `useSafeMutation`, the POS cart reducer, and the due-collection RPC client wrapper.
4. Add a `pre-commit` script (lint + typecheck) so regressions can't land silently.

---

## Technical notes

- **Backwards compatibility**: All RPCs (`complete_sale`, `collect_due`) are additive. Old code paths can be removed in the same PR that introduces the RPC, since both client and DB ship together.
- **Migrations introduced**: partial unique index on `products.imei`, hot-path indexes, two SECURITY DEFINER RPC functions with `SET search_path = public`, storage policy update on `branding` bucket.
- **No feature regression**: POS flow, due collection UI, investment CRUD, supplier returns, role-based menu visibility, Bengali localization, and the Velvet design tokens remain untouched.
- **Rollout order matters**: Phase 0 → 1 must ship first (utilities + data integrity). Phases 2–7 are independent and can be scheduled in any order, in small PRs.

---

## What I will implement first, on approval

Phase 0 in full + the two highest-value Phase 1 items:

1. `validation.ts`, `errors.ts`, `ErrorBoundary`, shared `QueryClient`, `logger`.
2. `complete_sale` RPC + POS rewiring (eliminates stock race).
3. `collect_due` RPC + DueCollection rewiring (eliminates double-collection race).
4. `useSafeMutation` + retrofit on POS, DueCollection, Products, Investments.

After this batch lands, subsequent phases will be opened as separate plans so you can review each change set in isolation.
