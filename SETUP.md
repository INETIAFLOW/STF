# STF — Local Setup

## Prerequisites

- Node.js 20+ and npm
- A Supabase project (this repo is configured for
  `https://mcwuzmzslujnlzagijhc.supabase.co`)

## 1. Install

```bash
npm install
```

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to find it | Used by |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Auth (browser + server) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API → publishable key | Auth (safe for the browser) |
| `DATABASE_URL` | Supabase → Settings → Database (pooled, port 6543, or direct 5432) | App runtime (Prisma) |
| `DIRECT_URL` | Supabase → Settings → Database (direct, port 5432) | Migrations + seed (CLI) |
| `STF_DEV_FAKE_SESSION` | dev only — see SECURITY-NOTES.md | Preview without auth/DB |

## 3. Database

```bash
npm run db:generate    # Prisma client → src/generated/prisma
npm run db:migrate     # applies prisma/migrations against DIRECT_URL
npm run db:seed        # catalog + fictional "Demo Trading Co." tenant
```

The seed is idempotent and contains **placeholder data only** — four
`dev.*@example.com` users, role templates, module/feature defaults. No
real company or person is ever hardcoded.

### Creating a signable login

Supabase owns authentication. To sign in as the seeded owner:

1. Supabase dashboard → Authentication → Users → *Add user* — email
   `dev.owner@example.com`, any password, auto-confirm.
2. Sign in at `/sign-in`. On first sign-in the app links the Supabase
   account to the seeded user record by verified email
   (see SECURITY-NOTES.md → account linking).

## 4. Run

```bash
npm run dev
```

- `/sign-in` — public.
- `/` routes by role: `admin.access` → `/admin`, otherwise `/home`.
- Employee surface: `/home`, `/tasks`, `/attendance`, `/profile`.
- Admin surface: `/admin`, `/admin/modules`, `/admin/roles`,
  `/admin/settings`, plus module stubs.

### Preview without Supabase or a database

For UI review only, set in `.env.local`:

```
STF_DEV_FAKE_SESSION=owner   # or employee | admin | hr | manager
```

The shell renders with fixture data (clearly-labelled placeholders), all
guards still execute, and audit writes are skipped with a console warning.
Development mode only — see SECURITY-NOTES.md.

## 5. Verify

```bash
npm run test        # 26 unit tests: flags, catalog, tokens, status labels
npm run typecheck
npm run lint
npm run build
```

## Design tokens

`design/tokens/*.json` are verbatim copies of the approved handoff. If the
handoff updates, replace the JSONs and run:

```bash
npm run tokens
```

Never edit `src/styles/tokens.css` by hand — it is generated
(`DESIGN-SYSTEM-MAPPING.md` explains the pipeline).
