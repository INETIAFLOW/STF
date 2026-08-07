# STF Decisions Log

Append-only. Each entry: date, owner, decision, reason. Product-level
decisions belong in the Pack 01 documents first (Constitution §8); this
file records implementation decisions and any deviation from the approved
documents that needs review.

---

**D-P1-01 · 2026-08-07 · Stack confirmation** — Next.js App Router +
TypeScript + Tailwind v4 + PostgreSQL (Supabase) + Prisma 7 + Supabase
Auth/Storage + Zod + React Hook Form, as directed in the Phase 1 brief.
No conflict with SYSTEM-ARCHITECTURE.md (it prescribes boundaries, not a
stack); the modular-monolith layering is preserved. Prisma 7 requires the
driver-adapter API (`@prisma/adapter-pg`) and `prisma.config.ts`.

**D-P1-02 · 2026-08-07 · Three derived state-colour tokens** —
`component-states.md` §2 specifies exact hover/active values that are not
in `colors.json` (secondary button hover `#DDE3F9`, active `#D3DAF6`,
switch off-track hover `#B7BFD6`). Added in `scripts/generate-tokens.mjs`
as `--stf-color-brand-primary-subtle-hover/-active` and
`--stf-color-border-strong-hover`, with dark values derived to match the
dark ramp. Values come from the approved states matrix, not invention.
*Needs design confirmation of the three dark-mode values.*

**D-P1-03 · 2026-08-07 · Font loading via next/font** — Fonts are
self-hosted as required (downloaded at build, served from our origin,
`font-display: swap`, subsets latin+latin-ext). Deviation: the handoff
asks to preload exactly two faces (Wix 400, Schibsted 700); next/font
preloads per family, so all loaded heading+body weights are preloaded and
mono is not. Accepted for Phase 1; revisit with manual `@font-face` if
payslip PDF rendering needs exact control.

**D-P1-04 · 2026-08-07 · Select ships as styled native `<select>`** — The
spec permits native for ≤5 short neutral options, which covers every
Phase 1 screen. The searchable listbox + bottom-sheet variant (mandatory
above 8 options) is built with the first data-heavy screens (employee
directory, Phase 2).

**D-P1-05 · 2026-08-07 · Sign-in uses email + password, not phone** — The
approved login design (E·01) shows phone-number sign-in. Phone auth
requires an SMS/OTP provider decision (cost, DLT registration in India)
that is not yet approved. Phase 1 uses Supabase email+password with the
approved layout and footer copy; helper text reads "Use the email your
company registered." **Open question for product approval before
Phase 2** — see the completion report.

**D-P1-06 · 2026-08-07 · Module/feature toggles are read-only in Phase 1**
— Governed switches render true server-backed state but are locked with a
stated reason. Toggling requires the impact-confirm modal, dependency
computation, affected counts and audit events (Constitution §5); shipping
a toggle without that flow would violate the design contract, so it ships
complete in a later phase.

**D-P1-07 · 2026-08-07 · Dev preview session** — `STF_DEV_FAKE_SESSION`
renders the shell with fixture data in development only (double-guarded by
`NODE_ENV`). Exists so UI can be reviewed before Supabase/database
credentials are available. Remove or gate before any shared deployment
(SECURITY-NOTES.md).

**D-P1-08 · 2026-08-07 · Role-scope feature defaults deferred** — The flag
evaluator implements tenant, module, feature, permission (role) and
user-exception scopes. A separate role-scope *feature default* table
(FEATURE-FLAGS.md "role scope") is deferred until the first feature that
needs per-role defaults; the evaluator's order already reserves its place.

**D-P1-09 · 2026-08-07 · Employee-management UI routes gate on the
EMPLOYEES module** — Module Management, Roles and Settings are platform
capabilities; their pages gate on their permissions (`modules.manage`,
`roles.manage`, `settings.manage`) with the EMPLOYEES module as the
carrier module in `checkAccess`. Revisit if a dedicated "platform"
pseudo-module is added to the catalog.
