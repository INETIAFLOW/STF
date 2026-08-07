# STF — Sudarshan Task Force

Mobile-first, multi-tenant SaaS for practical workforce operations:
attendance, leave, payroll inputs, tasks, daily reporting and
tenant-controlled modules. Built for Indian SMEs.

**Status: Phase 2 — Daily Operations.** Attendance (check-in/out with
permitted-area and late rules, exception review), Leave (request →
paid/unpaid approval), Tasks (assign → proof → review), in-app
notifications, live dashboards and governed module toggles are built.

**Payroll is deliberately not built.** The roadmap requires approved
payroll rule documents and a local compliance review before any salary
calculation exists; the payroll screen is an explained shell.

## Source of truth

Product behaviour and design are defined by the approved documents — code
follows them, never the other way round:

| Location | Contents |
|---|---|
| `docs/STF-Pack-01-v0.1/` | Product Bible, Constitution, Vision, Modules, Feature Flags, Architecture, Roles, Roadmap |
| `docs/STF-Design-Handoff-v1/` | Brand, design tokens, components, screen designs, user flows, accessibility, copy deck |

Start with `docs/STF-Design-Handoff-v1/08-claude-code-handoff/README-FOR-CLAUDE-CODE.md`.
When product behaviour, a wireframe and code disagree, the latest approved
document wins. Material changes are logged in `DECISIONS.md`.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Prisma 7 +
PostgreSQL (Supabase) · Supabase Auth · Zod · React Hook Form · Lucide
icons · Vitest. A modular monolith — see `ARCHITECTURE.md`.

## Quick start

```bash
npm install
npm run tokens      # regenerate src/styles/tokens.css from design/tokens/
npm run dev         # http://localhost:3000
```

Full setup — environment variables, database migration, seed data and the
dev preview session — is in `SETUP.md`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build / serve |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm run test` | Vitest unit tests (flags, catalog, tokens, status) |
| `npm run tokens` | Regenerate CSS variables from the token JSONs |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Apply migrations (needs `DIRECT_URL`) |
| `npm run db:seed` | Seed catalog + fictional demo tenant |
| `npx tsx scripts/provision-user.ts <email> [ROLE]` | Give a login a role in the demo tenant (dev) |
| `npx tsx scripts/demo-data.ts [--clear]` | Create/remove placeholder activity for review (dev) |
| `npx tsx scripts/smoke-phase2.ts` | Exercise the daily loop against the database (dev) |

## Documentation map

| File | Contents |
|---|---|
| `SETUP.md` | Local setup, env vars, database, seed |
| `ARCHITECTURE.md` | Modular-monolith boundaries, auth flow, flag evaluation, audit |
| `DESIGN-SYSTEM-MAPPING.md` | How design files map to code (tokens → CSS → Tailwind → components) |
| `SECURITY-NOTES.md` | Tenant isolation, authorization layers, dev preview session, key handling |
| `DECISIONS.md` | Phase 1 decision log (append-only) |
