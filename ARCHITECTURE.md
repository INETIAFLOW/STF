# STF Architecture — Phase 1

Follows `docs/STF-Pack-01-v0.1/md/SYSTEM-ARCHITECTURE.md`: a well-structured
**modular monolith** with clear domain boundaries. Services are split only
when scale or ownership proves the need.

## Stack mapping

| Architecture layer (Pack 01) | Implementation |
|---|---|
| Client layer (responsive web/PWA) | Next.js App Router, React Server Components, Tailwind v4 |
| Application layer (identity, authz, flags, domains) | `src/lib/*` + server components/actions; server-side guards |
| Data layer (relational, tenant-scoped) | PostgreSQL (Supabase) via Prisma 7 + `@prisma/adapter-pg` |
| Object storage | Supabase Storage (private buckets; wired in a later phase) |
| Audit store | `audit_events` table, append-only |
| Cache/queue, search | Not yet — added when a module proves the need |
| Integration layer | Adapters added with Notifications delivery (Phase 2) |

## Repository layout

```
design/tokens/          Token JSONs (verbatim from the design handoff)
scripts/generate-tokens.mjs  → src/styles/tokens.css (generated; never hand-edited)
prisma/                 Schema, migrations, seed
src/
  app/                  Routes
    (auth)/sign-in      Public
    (employee)/…        Employee surface  — data-surface="employee"
    (admin)/admin/…     Admin surface     — data-surface="admin"
    unauthorized        No-access state
  proxy.ts              Session refresh + signed-in gate (Next proxy)
  components/ui/        Design-system components (30-spec subset for Phase 1)
  components/shell/     BottomNav, Sidebar, TopBar
  lib/
    catalog.ts          Modules, features, permissions, role templates (seeded)
    status.ts           Status = {key, label, tone} — fixed copy-deck labels
    db.ts               Lazy Prisma singleton (pooled URL)
    supabase/           Browser + server clients (@supabase/ssr)
    auth/               Session resolution (+ dev fixture), types
    authz/              Flag evaluator, entitlement loader, route guards
    audit.ts            Append-only audit helper
src/generated/prisma/   Generated Prisma client (gitignored)
```

## Domain boundaries (from Pack 01)

- **Platform / Shared** (Phase 1): tenants, module catalog, identity,
  permissions, feature flags, audit — `src/lib/{catalog,auth,authz,audit}`.
- **Attendance & Leave** (Phase 2): `src/lib/attendance/*`,
  `src/lib/leave/*`. Each has a pure `policy.ts` (no I/O — the rules), a
  `service.ts` for reads, and `actions.ts` for server actions.
- **Work** (Phase 2): `src/lib/tasks/*` — tasks, proof, review.
- **Notifications** (Phase 2): `src/lib/notifications/*` — in-app channel;
  provider adapters arrive with their flags.
- **Payroll**: not implemented. Its inputs (approved leave, attendance
  with `policySnapshot`, late minutes) are already recorded so a future
  run can be traced to them.

Each domain keeps its rules in a pure module so the same logic serves the
UI, server actions and future jobs identically.

## Security boundary (order is fixed)

1. **Authenticate** — Supabase Auth; `src/proxy.ts` refreshes the session
   and redirects signed-out users. It answers only "is anyone signed in".
2. **Resolve tenant membership** — `lib/auth/session.ts` maps the auth user
   to a `User` row and one ACTIVE `TenantMembership` (tenant + role +
   permissions). No tenant ⇒ no session.
3. **Evaluate access** — `lib/authz/flags.ts` in the documented order:
   tenant → module → feature → role permission → user exception → policy.
   The same pure function will drive UI, APIs, jobs, notifications and
   sync. **Server-side denial is mandatory; navigation only reflects it.**

Every tenant-owned query goes through helpers that carry `tenantId` from
the resolved session — never from client input.

## Feature flags

- Scopes (FEATURE-FLAGS.md): platform (module catalog), tenant
  (`tenant_module_settings`, `tenant_feature_settings`), user
  (`user_feature_exceptions`, time-bound), role (via permissions), policy
  (`policy` JSON on the tenant feature setting; versioned policy documents
  arrive with the business modules).
- A disabled module is **absent** from navigation (the bar re-balances) and
  denied server-side on every route that belongs to it.
- Governed switches in the UI never flip optimistically (Constitution §5).

## Audit (Constitution §3)

`lib/audit.ts` writes `audit_events` with actor, action, entity, reason,
before/after and timestamp. Append-only: no update/delete path exists in
application code. Module/feature changes, role changes, sensitive-data
access and approvals must all record events as those flows are built.

## Reliability decisions carried forward

Queued jobs (notifications, summaries, exports) will be idempotent and
traceable; offline attendance is captured as pending evidence and
validated server-side on sync; payroll preserves calculation inputs and
policy versions. These are Phase 2/3 obligations already reflected in the
schema style (policy JSON, audit store, UTC timestamps).
