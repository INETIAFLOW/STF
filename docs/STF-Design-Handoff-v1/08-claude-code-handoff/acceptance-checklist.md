# STF Acceptance Checklist — v1.0

Sign-off gate. A screen or release is not done until its boxes are ticked. Sections A–C apply to every screen; D–J are release-level.

## A. Design-system conformance (per screen)
- [ ] No raw hex, px radius, px shadow or ms duration outside the token files
- [ ] Correct surface context: employee = `#FAF8F5` + 16px cards; admin = `#F7F8FC` + 12px cards
- [ ] **No warm token anywhere on an admin surface** (payroll, reports, audit, modules, roles, settings)
- [ ] At most **one** warm element on an employee screen, and only for an approved positive moment
- [ ] Type scale correct for the viewport; no weight below 400; no body text below 14px mobile / 13px desktop
- [ ] All times, hours, counts and amounts in Spline Sans Mono with tabular figures
- [ ] Currency as `₹` with Indian grouping; dates as `7 Aug 2026`; week starts Monday
- [ ] Icons are Lucide at the specified size and stroke, coloured by `currentColor`
- [ ] Logo used per `logo-usage.md` (clear space, minimum size, correct variant)

## B. Content and behaviour (per screen)
- [ ] Copy matches `copy-deck.md` verbatim where a string is specified
- [ ] Every status renders a **word**, never colour alone, and is never truncated
- [ ] Every consequence-bearing action shows its computed sentence **before** activation
- [ ] Reject / disable / override paths require a reason
- [ ] Decisions leave a persistent audit line on the record
- [ ] Empty, loading, error and offline states implemented with the approved copy
- [ ] No partially loaded number, hour total or salary is ever displayed
- [ ] Every disabled control states its reason
- [ ] Only enabled modules appear in navigation; disabled ones are absent, not greyed

## C. Responsive and accessibility (per screen)
- [ ] Completes at 360px with no horizontal scroll; reflows at 320px (WCAG 1.4.10)
- [ ] Renders correctly at 768, 1024, 1440 and at 200% zoom
- [ ] Any table has its stacked-card mobile alternative
- [ ] Touch targets ≥48×48 employee / ≥40×40 admin, ≥8px apart
- [ ] Primary mobile action full-width, 56px, in the thumb zone
- [ ] Keyboard-only completion of the primary task; visible focus on every interactive element
- [ ] Screen-reader pass (NVDA or TalkBack): headings, labels, live regions, announced outcomes
- [ ] Contrast audit passes for text, borders, focus rings and status graphics
- [ ] Colour-blindness simulation (deuteranopia + achromatopsia): every status still readable
- [ ] `prefers-reduced-motion` and forced-colors passes
- [ ] Sticky bars never obscure the focused element (WCAG 2.2 Focus Not Obscured)

## D. The five integrity patterns
- [ ] **Consequence before action** implemented as a data contract, not hard-coded strings
- [ ] **Impact confirm** used for payroll approval, module disable and permission change — with counts, retention reassurance, required reason and typed confirmation where specified
- [ ] **Approval card** shared by attendance exceptions, leave, task proof and payroll adjustments
- [ ] **Governed switches** never flip before server confirmation; revert with a plain reason on failure
- [ ] **Attendance action card** handles inside / outside / location-off / late / submitting / confirmed / offline / duplicate-tap / policy-off

## E. Feature flags and tenancy (Constitution §2, §5)
- [ ] Flag evaluation covers tenant → module → feature → role → user exception → policy
- [ ] The same decision governs navigation, UI, API, background jobs, notifications, reports and offline sync
- [ ] Server-side denial verified — UI hiding alone fails the gate
- [ ] Disabling a module removes navigation, denies APIs, stops jobs, and creates an audit event
- [ ] Re-enabling restores navigation with historical data intact
- [ ] Every tenant-scoped query, file and notification is isolated; cross-tenant access is platform-only and audited
- [ ] Support/impersonation sessions show a persistent, non-dismissible warning band

## F. Payroll (Constitution §6)
- [ ] Every figure traceable to inputs, policy version, adjustments, approvals and period
- [ ] Approval locks the period; later changes only via an auditable adjustment
- [ ] Employees with no salary structure are excluded **and named** in the approval modal
- [ ] Unreviewed exceptions are surfaced with counts before approval
- [ ] Negative net pay blocks approval with the reason stated
- [ ] Totals reconcile to the sum of lines; one documented rounding rule, stated on the payslip
- [ ] No compliance claim anywhere; the accountant acknowledgement is required

## G. Privacy (Constitution §7)
- [ ] Location captured only at check-in and check-out; no continuous or background tracking
- [ ] Every capture point explains its purpose in text on the screen
- [ ] Employees can see what was recorded about them, in the same words the admin sees
- [ ] Salary, bank details, documents and location are behind specific permissions and an explicit action
- [ ] Sensitive-data access and exports are logged with name and time
- [ ] Retention settings honoured; export and deletion workflows exist

## H. Offline and reliability
- [ ] Check-in, check-out, task proof and leave queue locally and confirm locally
- [ ] Queued items keep their original capture time and show `Waiting to send`
- [ ] Reconnect syncs automatically with one summary confirmation
- [ ] Conflicts become exceptions showing both versions — nothing silently lost or overwritten
- [ ] Admin approval, payroll and configuration are explicitly unavailable offline
- [ ] Server time is authoritative for attendance and is echoed back to the user

## I. Scope discipline
- [ ] No V2 feature present (biometric/face/QR/RFID, continuous tracking, visitor register, bank transfers, accounting/CRM/inventory integrations, holiday calendar, earned-leave balances, white-label domains, extra languages)
- [ ] No module, status, role or permission beyond Pack 01 and `screen-inventory.md`
- [ ] Optional modules appear only as `Not available` until their rules are approved

## J. Marketing
- [ ] No customer names or logos, no adoption/accuracy/uptime statistics, no compliance or security badges
- [ ] No prices — placeholders render `₹ —`
- [ ] "Designed for Indian SMEs" is the only positioning claim used
- [ ] No wording implying guaranteed statutory payroll compliance
- [ ] Product screenshots use sample data only, with no real employee names or figures

## K. Release gate
- [ ] All P1 screens pass A–H
- [ ] `design-decisions.md` updated for every deviation, with approval recorded
- [ ] Token file and CSS variables are generated from one source, not hand-maintained twice
- [ ] Lint rules active: no raw design values; no warm token under `[data-surface="admin"]`
- [ ] Accessibility audit report attached
- [ ] Pilot-readiness reviewed against `STF Pack 01 → ROADMAP.md` Phase 2 exit criteria
