# STF Design System — Implementation Guide v1.0

Framework-agnostic. It tells you what to build and in what order, not which library to use.

## 1. Build order
1. **Tokens** → CSS custom properties from `02-design-tokens/`. Nothing else starts first.
2. **Type and surface primitives** → the two surface contexts (`data-surface="employee" | "admin"`), heading/body/mono utilities, the responsive type switch at `lg`.
3. **Primitives** → Button, Icon button, Input, Select, Checkbox, Radio, Switch, Status chip, Avatar, Card.
4. **Composites** → Table + its stacked mobile alternative, Tabs, Modal, Drawer, Toast, Alert banner, Empty/Loading/Error states, File upload.
5. **STF-specific** → Attendance action card, Metric card, Employee row, Task card, **Approval card**, Impact confirm, Governed switch.
6. **Shells** → Employee mobile shell (top bar + bottom nav + safe areas), Admin shell (sidebar + top bar + drawer host).
7. **Screens** in the P1→P4 order of the README.

Do not build screens before step 5 exists. The approval and impact patterns are where this product's integrity lives; retrofitting them is how they get watered down.

## 2. Token → CSS
```
:root {
  --color-brand-primary: #2F45C4;
  --color-surface-canvas: #F7F8FC;
  --color-surface-canvas-warm: #FAF8F5;
  --space-4: 16px;
  --radius-card: 12px;
  --radius-card-employee: 16px;
  --shadow-elevation-2: 0 1px 3px rgba(18,23,46,.08), 0 1px 2px rgba(18,23,46,.04);
  --motion-duration-base: 180ms;
}
[data-theme="dark"] { /* colour block only */ }
@media (min-width: 1024px) { :root { /* typography sizes only */ } }
```
Generate this file from the JSON; do not hand-maintain both. Add a lint rule that fails the build on a raw hex, px radius or px shadow inside component styles.

## 3. Surface contexts
```
<body data-surface="employee">   → canvas #FAF8F5, cards 16px, warm tokens permitted (max 1/screen)
<body data-surface="admin">      → canvas #F7F8FC, cards 12px, warm tokens FORBIDDEN
```
Components read the context; they do not take a `warm` prop. Add a lint/test that fails if a warm token resolves inside `[data-surface="admin"]`.

## 4. Status is a data contract, not a colour
Model status as `{ key, label, tone }` where `tone ∈ success | warning | error | info | neutral`. The renderer always prints `label`. It is impossible, by construction, to render a status as colour alone.

Fixed labels (do not paraphrase): Present · Late 18 min · Absent · On Leave · Half Day · Pending review · Approved · Rejected · Not recorded · Outside area — needs approval · Exempted · Not started · In progress · Submitted for review · Completed · Overdue · Draft · Locked.

## 5. The consequence contract
Any action that changes attendance, leave, pay or configuration must be given a computed consequence before it renders:
```
{ sentence, detail?, affected?: {employees, adminUsers}, requiresReason: bool, requiresTypedConfirm?: string }
```
- The UI renders `sentence` next to or above the control **and** appends it to the control's accessible name.
- `requiresReason` disables the primary action until a reason exists.
- Generic fallback text is not acceptable — if the consequence cannot be computed, the action is not ready to ship.

## 6. Feature flags
Evaluate tenant → module → feature → role → user exception → policy on **every** request. The same decision drives navigation, UI, API authorization, background jobs, notifications, reports and mobile offline sync. Server-side denial is mandatory; hiding a menu item is never the control (Constitution §5).

UI consequences:
- Disabled module → its nav item is **absent**, and the nav re-balances. Not greyed, not teasing.
- Disabled feature inside an enabled module → the control is absent, or shown disabled **with a stated reason** where its absence would be confusing.
- A stale client that renders a disabled action → the server denies it with a plain message and the client refreshes its configuration.

## 7. Offline
Queue locally and confirm locally for: check-in, check-out, task proof, leave request. Each queued item carries its original capture time and shows a neutral `Waiting to send` chip. On reconnect, sync and show one summary toast. Server records win conflicts; the losing version becomes an exception showing both. Admin surfaces (approvals, payroll, configuration) are explicitly unavailable offline rather than optimistically accepted.

## 8. Time, money, dates
- Server time is authoritative for all attendance events and is echoed back to the user.
- Store UTC, display in the tenant's timezone (IST default).
- Dates display as `Fri, 7 Aug 2026`; never MM/DD. Week starts Monday.
- Currency `₹` with Indian grouping (`₹1,42,800`), monospaced, tabular, right-aligned. One documented rounding rule, stated on the payslip; totals always reconcile to the sum of lines.
- Durations as `2:06` (h:mm) in data contexts, "2 h 06 m" in prose.

## 9. Motion
Durations 80–320ms only. `prefers-reduced-motion` replaces transforms with opacity changes and freezes skeleton shimmer. Never animate a number in payroll or attendance. Spinners only after 400ms. The check-in confirmation is a single 1→1.03→1 pulse — no confetti, no celebration animation.

## 10. Quality gates before any screen is "done"
- [ ] Renders correctly at 360, 768, 1024, 1440 and at 200% zoom; reflows at 320
- [ ] Empty, loading, error and offline states implemented with the approved copy
- [ ] Every status renders a word
- [ ] Every consequence-bearing action shows its computed sentence
- [ ] Keyboard-only completion of the primary task
- [ ] Screen-reader pass: headings, labels, live regions
- [ ] No raw colour/radius/shadow values
- [ ] No warm token on an admin surface
- [ ] Feature-flag behaviour verified server-side, not just visually
