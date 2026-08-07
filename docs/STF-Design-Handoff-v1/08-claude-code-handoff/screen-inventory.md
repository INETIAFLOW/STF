# STF Screen Inventory — v1.0

**Design source files** (open in a browser; each is a canvas of full-fidelity screens):
- `E` = `05-screen-designs/STF-Employee-Screens.dc.html`
- `A` = `05-screen-designs/STF-Admin-Screens.dc.html`
- `C` = `05-screen-designs/STF-Admin-Config-Screens.dc.html`
- `M` = `05-screen-designs/STF-Marketing-Screens.dc.html`
- `D` = `05-screen-designs/STF-Brand-Directions.dc.html` (the three explored directions and the comparison — reference only, 1c was chosen)

Priority: **P1** daily loop · **P2** approvals and records · **P3** money and governance · **P4** marketing.

## Employee (mobile-first, 360px baseline)

| # | Screen | Pri | Design | Key states |
|---|---|---|---|---|
| E1 | Login | P1 | E·01 | default, focus, error, loading |
| E2 | Forgot password / OTP | P1 | E·02 | idle, resend timer, expired, invalid |
| E3 | Home dashboard | P1 | E·03 | checked-in, not checked in, empty tasks, offline |
| E4 | Check-in — inside area | P1 | E·04 | ready, late consequence, submitting |
| E5 | Check-in confirmation (warm) | P1 | E·05 | success, elapsed hours, offline queued |
| E6 | Check-in — outside area | P1 | E·06 | warning, reason required, sent for approval |
| E7 | Check-out | P1 | E·05 | ready, day summary after checkout |
| E8 | Attendance calendar | P2 | E·07 | month with status dots, day detail, empty |
| E9 | Attendance history | P2 | E·08 | list, correction request, empty, loading |
| E10 | Leave request | P2 | E·09 | form, payroll consequence, validation |
| E11 | Leave status / history | P2 | E·10 | pending timeline, approved, rejected with reason |
| E12 | My tasks | P1 | E·11 | today/open/in review/done tabs, empty |
| E13 | Task details | P1 | E·12 | in progress, overdue, completed, activity |
| E14 | Submit task proof | P1 | E·13 | camera/file, uploading, per-file error, offline |
| E15 | Notifications | P2 | E·14 | grouped today/earlier, empty |
| E16 | Employee profile | P2 | E·15 | default, sign out |
| E17 | My documents | P2 | E·16 | verified, pending review, upload |
| E18 | Payslip list | P3 | E·17 | paid, not ready, empty |
| E19 | Payslip details | P3 | E·18 | full breakdown, download |
| E20 | Empty / loading / error / offline | P1 | E·19 | all four patterns |

## Admin & HR

| # | Screen | Pri | Design | Notes |
|---|---|---|---|---|
| A1 | Admin dashboard | P1 | A·A1 | metrics, review queue, payroll status, daily summary, activity |
| A2 | Attendance dashboard | P1 | A·A2 | filters, 5 metrics, table, pagination, mobile stacked alternative |
| A3 | Attendance exceptions / corrections | P1 | A·A3 | approval cards, bulk review, resolved with audit line |
| A4 | Employee directory | P2 | A·A4 | filters, search by name or phone, active/inactive |
| A5 | Employee profile & documents | P2 | A·A5 | tabs, gated payroll details, document verification |
| A6 | Leave approval queue | P2 | A·A6 | payroll-open banner, paid/unpaid decision, queue table |
| A7 | Create task | P2 | A·A7 | assignee, priority, due, time frame, proof requirement, preview |
| A8 | Task list | P2 | A·A8 | tabs with counts, statuses |
| A9 | Task detail & proof review | P1 | A·A8 | drawer with proof, note, impact, three decisions |
| A10 | Daily report dashboard | P2 | A·A9 | attendance/tasks/exceptions, delivery channels, last sent |
| A11 | Attendance policy settings | P3 | A·A10 | grace, deduction, exemption, location, offline |
| A12 | Shift & office timing settings | P3 | A·A10 | shift list with coverage |
| A13 | Leave policy settings | P3 | A·A10 | half day, emergency, unavailable V2 items, approver chain |
| A14 | Payroll dashboard / run preview | P3 | C·B1 | draft warning, per-row status, totals, inputs |
| A15 | Payroll approval | P3 | C·B2 | impact confirm: lock, exclusions, warnings, reason, checkbox |
| A16 | Payslip view (admin) | P3 | E·18 | same breakdown, admin context |
| A17 | Reports & export | P3 | C·B7a | report type, period, format, permission note, recent exports |
| A18 | Notification settings | P3 | C·B7b | event × channel matrix, unconfigured channel, quiet hours |
| A19 | Role & permission management | P3 | C·B5 | templates, record scope, sensitive permissions, change warning |
| A20 | Module Management | P3 | C·B3 | module cards, feature controls, dependencies, affected counts, history |
| A21 | Feature-level toggle controls | P3 | C·B3 | inside each module card |
| A22 | Module dependency warning | P3 | C·B4 | impact, what stops, counts, retention, typed confirm, reason |
| A23 | Activity log / audit history | P3 | C·B6 | who/what/when/reason/type, sensitive access entries |
| A24 | Company / tenant settings | P3 | C·B7c | company, logo, branches, retention |

## Marketing

| # | Screen | Pri | Design | Notes |
|---|---|---|---|---|
| M1 | Landing home (desktop) | P4 | M·M1 | hero with product preview, five capabilities, "evidence not surveillance", CTA band |
| M2 | Landing hero (mobile 360) | P4 | M·M2 | stacked hero, single CTA |
| M3 | Features overview | P4 | M·M1 | the five-capability section, expandable to a full page |
| M4 | Module overview | P4 | M·M4 | core vs optional, dependencies, explicit V1 exclusions |
| M5 | Pricing placeholder | P4 | M·M5 | three tiers with **₹ —**, no prices |
| M6 | Request demo / login CTA | P4 | M·M6 | demo form, sign-in explainer |

## Not in V1 — do not build
Biometric / face / QR / RFID attendance · continuous or background location tracking · visitor register · bank transfer generation · Tally/Busy/Zoho or accounting integrations · CRM · inventory · holiday calendar · earned-leave balances · white-label domains · additional language packs · leaderboards beyond a published scoring definition.

**Counts:** 20 employee screens · 24 admin screens · 6 marketing screens = **50 screens**.
