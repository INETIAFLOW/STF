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

---

## Phase 2 — Daily Operations

**D-P2-01 · 2026-08-08 · Unprovisioned accounts land on /unauthorized** —
An authenticated Supabase user with no active membership was redirected to
`/sign-in`, which the proxy bounces back for signed-in users — an infinite
loop. `requireSession` now distinguishes "anonymous" from "authenticated
but not provisioned" and sends the latter to the no-access screen, which
gained a Sign out action.

**D-P2-02 · 2026-08-08 · Leave is unpaid by default, paid by decision** —
V1 has no earned-leave balances and no holiday calendar, so a request is
computed as unpaid days and the approver makes an explicit
"Approve as unpaid" / "Approve as paid" choice, recorded with a reason.
No silent default (user-flows.md §4). Actual salary maths is NOT computed
— the consequence line states the payroll effect in words only.

**D-P2-03 · 2026-08-08 · Location is assessed once per screen load, not
continuously** — The consequence must be visible BEFORE the tap, so the
browser position is resolved when the check-in card mounts. Nothing is
tracked between check-in and check-out (decision D-016, Constitution §7).
Accuracy worse than 200 m is treated as "cannot confirm" and routed to the
approval path, never a silent pass.

**D-P2-04 · 2026-08-08 · Dev preview session reads the real database** —
`STF_DEV_FAKE_SESSION` now resolves the demo tenant's real membership when
`DATABASE_URL` is set, falling back to static placeholders otherwise. Page
code guards on `devFixtureOffline()` ("is there a database?") rather than
"is this a preview session?". Still development-only and double-guarded.

**D-P2-05 · 2026-08-08 · Task proof storage uses a private Supabase
bucket** — Files upload to the `task-proof` bucket under a task-id prefix;
photos are downscaled client-side to a 2000 px long edge. The bucket must
be created as PRIVATE and read back only through signed URLs — see
SECURITY-NOTES.md. Until it exists, proof submission reports a plain
"storage isn't configured" error rather than failing silently.

**D-P2-06 · 2026-08-08 · Payroll remains gated** — Attendance, leave and
task inputs are now recorded, but no payroll calculation exists. The
roadmap requires approved payroll rule documents plus local compliance
review before that code is written (ROADMAP.md decision gates,
Product Bible boundaries). The payroll screen stays an explained shell.

**D-P2-07 · 2026-08-08 · Notifications ship in-app only** — The
Notifications module is CORE, so in-app delivery is always available.
Push, email, WhatsApp and SMS remain behind their feature flags until
providers are configured; the daily report shows each channel's true state
as Enabled/Disabled rather than failing silently (user-flows.md §6).

---

## Phase 3 — Payroll and Reporting

**D-P3-01 · 2026-08-08 · STF ships NO statutory formulas** — The payroll
engine contains no PF, ESI, professional tax or TDS calculation. Those are
tenant-defined salary components whose amount or percentage the customer's
accountant supplies, flagged `isStatutory` so every screen and payslip can
say who defined them. This is the only reading consistent with the Product
Bible ("statutory compliance must be configured and reviewed by a
qualified local professional") and D-019. Approval requires the
accountant acknowledgement; no screen ever claims compliance.
*Reopens if:* a licensed local payroll professional signs off specific
rules for inclusion, documented as an approved rule document first.

**D-P3-02 · 2026-08-08 · One documented rounding rule** — Half-up to whole
rupees, applied per component, and totals are summed from the ROUNDED
lines so a payslip always reconciles to what is printed. Stated on the
payslip (Constitution §6, edge-cases.md → Payroll → Rounding).

**D-P3-03 · 2026-08-08 · Pro-rating is per calendar day** — Payable days =
days in the month − unpaid days (unpaid leave + absent days if the tenant's
policy deducts them + days converted from repeated lateness). Components
marked `prorated` scale by payableDays/calendarDays; PER_DAY components are
not pro-rated twice. Working-day calendars would need a holiday calendar,
which is explicitly out of V1 scope.

**D-P3-04 · 2026-08-08 · Approval re-computes server-side and locks** — The
client never submits figures. On approval the run is recalculated from the
database, blocked if any net pay is negative, and employees with no salary
structure are named as excluded. After approval the run is immutable;
money changes only through a `PayrollAdjustment` carrying a label, signed
amount, reason and actor, which changes net pay and leaves gross and
deductions as calculated.

**D-P3-05 · 2026-08-08 · Policies are versioned, never edited in place** —
`TenantPolicy` stores a new version on every change and retires the
previous one. Approved payroll keeps the `policyVersion` it was calculated
with, and a salary structure cannot be back-dated into an approved period
(edge-cases.md: a policy change never rewrites past days).

**D-P3-06 · 2026-08-08 · Exports exclude money and are logged** — Report
export covers attendance, leave and tasks only; salary and bank details
are never in a report export. Exporting requires `reports.export` and
writes an audit event naming the type, period and row count.

**D-P3-07 · 2026-08-08 · The Owner role cannot be de-permissioned** — Role
editing refuses to strip the Tenant Owner, so a company can never lock
itself out of its own data. All other roles are freely configurable within
the platform catalog.

---

## Phase 4 — Marketing and pilot readiness

**D-P4-01 · 2026-08-08 · Marketing renders on the admin surface** — The
public pages are owner-facing, so they use Disha precision with no warm
tokens (brand-guidelines.md §4). Copy is verbatim from copy-deck.md §11;
prices render as `₹ —`; no customer names, statistics, badges or
compliance claims appear.

**D-P4-02 · 2026-08-08 · The demo form does not submit** — Where enquiries
should go (inbox, CRM or WhatsApp) is not decided, and storing a
prospect's details needs a privacy notice. Rather than dropping requests
silently, the form states plainly that it is not connected, stores
nothing, and offers a direct alternative. **Open question for approval.**

**D-P4-03 · 2026-08-08 · Signed-out visitors land on marketing** — `/`
routes to `/product` when there is no session, so the public site is the
front door and `/sign-in` stays for people who already have an account.

---

## Phase 5 — Multi-location

**D-P5-01 · 2026-08-09 · New feature flag `ATTENDANCE.any_branch_check_in`**
— Lifecycle metadata per FEATURE-FLAGS.md: key `any_branch_check_in`;
description "Check in at any company location"; scope tenant + user;
owner Tenant Owner; default **off** (it relaxes a control, so it is opted
into, matching `multiple_punch`); depends on `ATTENDANCE.geofence`;
rollout general; no retirement date.
Deliberately **no** `multi_branch` flag: multiple locations are already
approved (MODULES.md puts branches under Tenant Settings, A24 lists them)
and there is no coherent off-state — "off" would mean refusing to create a
second row, which is a limit, not a capability. Per the flag doc it would
be born retired.

**D-P5-02 · 2026-08-09 · Roaming is a boolean, not a set of locations** —
`TenantMembership.canCheckInAtAnyBranch`. The approved model
(edge-cases.md) is "their profile allows multi-branch" — one bit. A join
table would be strictly more expressive than the approved rule, need
set-management UI, and could not be filled from existing data. Revisit
only if a customer asks for "these three shops specifically".

**D-P5-03 · 2026-08-09 · Per-location radius overrides the tenant default**
— `Branch.radiusM` is now nullable: null inherits the tenant's attendance
policy, a value overrides it. A warehouse yard needs more room than a shop
counter. Resolution happens once, server-side, in `loadAttendanceContext`.

**D-P5-04 · 2026-08-09 · Fixed: saving the attendance policy destroyed
per-location and per-shift settings** — `saveAttendancePolicyAction` ran
`branch.updateMany({ radiusM })` and `shift.updateMany({ graceMinutes })`
across the whole tenant, so saving the policy form silently overwrote every
radius and grace an admin had deliberately set elsewhere. Both removed; the
policy value is now the default that locations and shifts inherit. The form
states how many locations are affected before saving.
*Behaviour change an owner may notice:* editing the policy no longer
propagates grace to existing shifts.

**D-P5-05 · 2026-08-09 · An attendance record explains itself** —
`policySnapshot` v2 stores the policy version and the home and matched
locations **by value** (name and coordinates), plus which radius applied
and the exact consequence sentence the employee accepted. A later rename or
move cannot change what a past day says. Records with no `v` are the Phase 3
shape and are never rewritten; `describeAttendanceRecord` reads both and
flags when a name came from the live join rather than the record.

**D-P5-06 · 2026-08-09 · No home location is a stated gap, not "no check"**
— A membership with no branch while the company has locations now surfaces
"Your work location isn't set — ask your manager" instead of silently
skipping the permitted-area check. The migration deliberately does **not**
guess anyone's workplace.

**D-P5-07 · 2026-08-09 · The location filter lives in the URL, per page** —
`?branch=<id>`, validated server-side against the tenant's own locations
before it reaches any query. Not a global top-bar control: App Router
layouts do not receive `searchParams`, and a global filter would leak into
payroll and roles, which have no location dimension.

---

## Phase 6 — Completing V1

**D-P6-01 · 2026-08-09 · A membership IS the workforce record** — Employee
Management extends `TenantMembership` (designation, joinedOn) rather than
adding a parallel `Employee` table. Attendance, leave, tasks and payroll
already point at the membership; a second identity for the same person
would need constant reconciliation.

**D-P6-02 · 2026-08-09 · Employee documents get their own private bucket**
— `employee-documents`, insert-only, no read policy; reads are short-lived
signed URLs minted after a permission check, and every view is audited.
Downloading *someone else's* document needs the separately-permissioned
`documents.download`; `documents.view` alone lets you see that a document
exists but not open it.

**D-P6-03 · 2026-08-09 · Forgot-password is email, not OTP** — Screen E2
specifies a 6-digit code to a phone. Phone auth still needs an SMS
provider and DLT registration (D-P1-05 is open), so the reset link goes by
email — the same journey on the channel we have. The response is identical
whether or not the address is registered, so it cannot be used to discover
who works at a company.

**D-P6-04 · 2026-08-09 · Missed check-out is a request, never an
invention** — The employee proposes a time with a reason; it is stored as
a pending exception and only becomes the record when a manager approves.
STF never writes a check-out time nobody gave it (edge-cases.md).

**D-P6-05 · 2026-08-09 · Company logo upload deliberately not built** —
The screen says why: where tenant files are stored and how long they are
kept is unsettled, and accepting a file we cannot promise to keep safely
would be worse than not accepting it. Retention is an open item in
ACCEPTANCE.md §G.

**D-P6-06 · 2026-08-09 · RLS enabled with no permissive policy** — All 25
tenant tables have row-level security on and no policy for anon or
authenticated, so the API keys can read nothing. The app connects as the
table owner and is unaffected — verified by running all three smoke suites
before and after. A per-tenant JWT-claim policy was deliberately NOT
written: the app resolves tenancy server-side from the session, so such a
policy would never be consulted on the path we actually use, and would be
decoration. `scripts/setup-rls.ts --rollback` undoes it.

**D-P6-07 · 2026-08-09 · Horizontal overflow is clipped at the document**
— Tooltips and toasts are positioned over the page and could extend the
scroll area at 320px, breaking WCAG 1.4.10. `overflow-x: clip` on `html`
(not `hidden`, which would break sticky headers and the bottom nav).
Verified in-browser: horizontal scrolling is impossible at 320px.

**D-P6-08 · 2026-08-09 · The acceptance checklist is recorded honestly** —
`ACCEPTANCE.md` walks sections A–K and marks items Not met where they are
not met, notably screen-reader testing, retention workflows and the
offline queue. Ticking them would have been faster and false.
