# READ THIS FIRST — STF Design Handoff v1.0

Product: **Sudarshan Task Force (STF)** · Tagline: **Workforce • Tasks • Attendance • Payroll**
Package: `STF-Design-Handoff-v1.zip` · Date: 07 August 2026 · Status: **Approved for implementation**

This package is a design specification, not application code. It sits **below** STF Pack 01 in authority: if this package and an approved Pack 01 document disagree, the Pack 01 document wins and this package must be corrected first.

---

## 1. The visual direction is decided

**Base: Disha — Modern Fintech-Clean.** Indigo foundation, airy white and neutral surfaces, crisp typography, clear data hierarchy, restrained status colour.

**Restricted warmth from Sahay**, employee-facing only:
- warmer off-white canvas (`color.surface.canvasWarm` #FAF8F5)
- softer card corners (`radius.cardEmployee` 16px vs admin 12px)
- one warm terracotta element per screen for positive human moments only: check-in/out success, welcome, recognition, supportive empty states
- human, respectful microcopy

**The one-line rule:**
> Modern fintech precision for owners and admins, with a supportive and respectful experience for employees.

**Warm terracotta `#A2451F` is never:** the primary brand colour, a button in admin, a status colour, or present anywhere in payroll, reports, audit logs, module management, roles or company settings. Those surfaces stay strictly Disha.

Implement the two surface families as a layout-level attribute — `data-surface="employee" | "admin"` — not as a per-component prop.

---

## 2. Fonts and how to load them

| Role | Family | Weights |
|---|---|---|
| Headings, buttons, nav | **Schibsted Grotesk** | 600, 700 |
| Body, UI, labels | **Wix Madefor Text** | 400, 500, 600 |
| Times, hours, money, IDs | **Spline Sans Mono** | 400, 500, 600 |

All three are SIL OFL Google Fonts.

**Loading method — self-host, do not use the Google CDN.** Subset latin + latin-ext, WOFF2, `font-display: swap`. Preload exactly two faces: *Wix Madefor Text 400* and *Schibsted Grotesk 700*. Enable `font-variant-numeric: tabular-nums` on all mono text and on numerals inside tables. Reasons: offline-first mobile use, predictable payslip PDF rendering, and no third-party request on every load.

Fallback stack must be metric-tolerant: `"Helvetica Neue", Helvetica, Arial, sans-serif`. The UI must be readable and usable before webfonts arrive.

---

## 3. Token files to use

Use `02-design-tokens/`. Read `tokens.json` if your build takes one source, otherwise the seven individual files.

Emit CSS custom properties on `:root`; `[data-theme="dark"]` overrides **only** the colour block; one `@media (min-width: 1024px)` block overrides the typography sizes. Mapping is mechanical: dots → hyphens, camelCase → kebab-case (`color.surface.canvasWarm` → `--color-surface-canvas-warm`).

**Light mode is the primary theme.** Dark values exist on every colour token; do not hand-tune dark per screen and do not ship a dark-mode-only feature.

**No raw values.** A component may not introduce a hex, radius, shadow or duration that is not a token. If one is missing, add the token and log it in `design-decisions.md`.

---

## 4. Approved component patterns

Build from `04-components/component-specifications.md` (30 components, each with variants, states, mobile/desktop behaviour, tokens and accessibility notes) plus `component-states.md`.

Five patterns carry the product's integrity — do not simplify them:

1. **Consequence before action.** Any control that changes attendance, leave, pay or configuration states its effect in text before activation, and the effect is part of the control's accessible name.
2. **Impact confirm modal.** consequence sentence → what stops working → affected employee/user count → data-retention reassurance → required reason → typed confirmation for irreversible module disables.
3. **Approval card.** requester → one-sentence request statement → evidence → **computed** impact line → decision actions (Reject always needs a reason) → persistent audit line after the decision.
4. **Governed switch.** State always shown as a word (Enabled/Disabled). Never flips optimistically — spinner until the server confirms, revert with a plain reason on failure.
5. **Attendance action card.** Live clock, location status as text, consequence banner, one full-width primary action in the thumb zone, warm confirmation afterwards.

**Icons: Lucide only** (see `03-icons/`). Three custom SVGs are permitted: the brand marks, the geofence status glyph, and geometric empty-state illustrations. Do not build a custom icon set.

---

## 5. Screen priorities

Build in this order. Do not start P2 before P1 is complete and reviewed.

**P1 — the daily loop (must work end to end)**
Login · Employee home · Check-in/out (inside area, outside area, late, offline) · My tasks · Task detail · Submit proof · Admin dashboard · Attendance dashboard · Attendance exceptions · Task proof review

**P2 — approvals and records**
Leave request · Leave status · Leave approval queue · Attendance calendar and history · Employee directory · Employee profile and documents · Create task · Task list · Notifications · Daily report dashboard

**P3 — money and governance**
Payroll dashboard · Payroll run/preview · Payroll approval · Payslip list and detail · Reports and export · **Module Management + feature toggles + dependency warning** · Roles and permissions · Activity log · Company settings · Attendance/shift/leave policy settings

**P4 — marketing**
Landing home · Features · Module overview · Pricing placeholder · Request-demo and login CTA states

Full list with source files: `screen-inventory.md`.

---

## 6. Responsive rules

- Design and build employee flows from **360px** upward; nothing may break at 320px.
- Breakpoints: 360 / 480 / 768 / 1024 / 1280 / 1536. Min-width queries only.
- Employees get **bottom navigation** (Home · Tasks · Attendance · Profile, labels always visible). Admin gets a **240px sidebar** at `lg`, a 72px rail at `md`, a drawer below.
- **Every data table needs a stacked-card mobile alternative.** A horizontally scrolling table is not acceptable for attendance, leave, tasks or payroll.
- Primary mobile action: full width, 56px, inside the thumb zone.
- Never hide approval state, exception reasons, payroll impact or audit information on small screens.

Details: `07-responsive-rules/`.

---

## 7. Accessibility requirements

WCAG 2.2 AA, verified at 360px and 1440px. Full standard in `04-components/accessibility.md`.

Non-negotiable:
1. **Status is text + colour, never colour alone** — every attendance, leave, task, payroll and module state carries a word.
2. Touch targets ≥48×48 employee / ≥40×40 admin, ≥8px apart.
3. Focus is always visible: 2px `color.border.focus` outline + `shadow.focusRing`, 2px offset, on every interactive element including cards, rows and chips.
4. Real semantics — `<button>`, `<a href>`, `<table>` with `<th scope>`, `<fieldset><legend>`. No clickable `div`.
5. Every disabled control states its reason.
6. `prefers-reduced-motion` respected system-wide; nothing auto-advances or auto-refreshes.
7. Errors say what happened and what to do next; form failures move focus to a summary banner.

---

## 8. What Claude Code must NOT invent or change without written approval

**Product scope**
- No V2 features. Not in V1: biometric/face/QR/RFID attendance, continuous or background location tracking, visitor register, bank-transfer generation, accounting integrations (Tally/Busy/Zoho), CRM, inventory, holiday calendar, earned-leave balances, white-label domains, additional languages.
- No new modules, statuses, roles or permissions beyond those in Pack 01 and `screen-inventory.md`.

**Design system**
- No new colours, fonts, radii, shadows or spacing values outside the token files.
- No terracotta on admin surfaces; no terracotta as a primary or status colour anywhere.
- No second icon library; no bespoke icon set; no emoji in product UI.
- No logo alterations: no recolouring, rotation, extra bars, restyled wordmark, or animating the mark into a spinner.

**Behaviour and safety**
- Never bypass an impact confirm, a required reason, or an audit event to "reduce friction".
- Never let a governed switch flip before the server confirms.
- Never let UI hiding be the only enforcement of a feature flag — server-side denial is mandatory.
- Never overwrite approved payroll; adjustments only, with reasons and before/after values.
- Never show a partially loaded number, hour total or salary figure.
- Never invent a check-out time for a missed punch.
- Never expose salary, bank details, documents or location without the specific permission, and never without logging the access.

**Copy and marketing**
- Product copy comes from `copy-deck.md` and `01-brand/voice-and-microcopy.md`. Status label strings are fixed — do not paraphrase.
- Marketing may say "Designed for Indian SMEs". It may **not** use customer names or logos, adoption or accuracy statistics, uptime claims, security or compliance badges, or any price. Payroll wording must never imply statutory compliance is guaranteed.

If a requirement conflicts with any of the above, stop and raise it as a document change (Product Constitution §8) rather than solving it in code.

---

## 9. Package map

```
01-brand/            logo SVGs, brand guidelines, logo usage, colour, typography, voice
02-design-tokens/    tokens.json + 7 token files + design-tokens.md
03-icons/            icon style guide, Lucide mapping
04-components/       component specifications, states, accessibility standard
05-screen-designs/   4 interactive HTML screen sets (employee, admin ops, admin config, marketing)
06-user-flows/       10 flows, edge cases, empty/loading/error/offline states
07-responsive-rules/ layouts, mobile-first, desktop-admin
08-claude-code-handoff/  this file + implementation guide, inventory, manifest, decisions, copy deck, acceptance checklist
```

Start with this file, then `design-system-implementation-guide.md`, then `screen-inventory.md`.
