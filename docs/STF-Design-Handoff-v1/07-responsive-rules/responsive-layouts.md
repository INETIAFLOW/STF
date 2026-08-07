# STF Responsive Layouts — v1.0

Tokens: `../02-design-tokens/breakpoints.json` · `spacing.json`

## 1. Breakpoints and what changes

| Token | Min-width | Layout |
|---|---|---|
| `xs` | 360px | Employee baseline. Single column, bottom nav, 20px screen padding, one primary action. Every employee flow must complete here. |
| `sm` | 480px | Larger phones. Metric cards 2-up. Padding unchanged. |
| `md` | 768px | Tablet. Bottom nav hidden → top navigation. Sidebar becomes a 72px icon rail. Cards 2-up. Tables return with a sticky first column. Modals still full-height sheets below this point, centred at and above it. |
| `lg` | 1024px | Desktop admin baseline. Sidebar 240px expanded. Full tables. Metric cards 4-up. Detail opens in a right drawer. Desktop type scale applies. |
| `xl` | 1280px | Wide admin. Dashboard splits 1.55fr / 1fr. Approval detail can sit beside the queue instead of in a drawer. |
| `2xl` | 1536px | Content capped at `layout.contentMaxWidth` (1440px) and centred; the canvas colour continues to the edges. |

Min-width queries only. No max-width query is used as the primary mechanism.

## 2. Grid and spacing

| | xs–sm | md | lg+ |
|---|---|---|---|
| Columns | 4 | 8 | 12 |
| Gutter | `space.4` 16px | `space.5` 20px | `space.6` 24px |
| Screen padding | `space.5` 20px | `space.6` 24px | `space.8` 32px |
| Section gap | `space.4` | `space.5` | `space.5` |
| Reading width | full − padding | 60ch | `layout.readingMaxWidth` 72ch |

## 3. Navigation

| Viewport | Employee | Admin |
|---|---|---|
| < md | Bottom nav, 4 items, labels always visible | Off-canvas drawer opened from the top bar; the tenant name stays visible in the bar |
| md | Top nav bar | 72px icon rail with focus tooltips |
| ≥ lg | Top nav bar | 240px sidebar, grouped, active item marked with colour **and** a 3px left indicator |

Disabled modules are absent at every size — the nav re-balances rather than showing a dead item.

## 4. Data tables — the mandatory mobile alternative

Below `md`, **every** table becomes a stacked card list. A horizontally scrolling table is not an acceptable mobile fallback for attendance, leave, tasks or payroll.

Stacked row pattern (see Employee row, §28 of the component spec):
```
line 1   avatar 44 · name (600) · status chip          ← chip never truncates
line 2   In 09:42 · Out — · Hrs 2:06                   ← labelled mono pairs
line 3   exception reason or payroll effect (conditional)
footer   full-width action buttons when a decision is needed
```
- Sorting and filtering move into a bottom-sheet filter with a visible "3 filters applied" chip.
- Bulk selection is available on mobile only where the action is safe and previewed with a count.
- At `md`, the table returns with the **name column sticky**; status and approval columns must remain visible without horizontal scrolling — push secondary columns (branch, employee code, device) into the scroll region instead.
- At `lg+`, full table with sortable headers, page sizes and a column-visibility menu. Payroll totals pin to the bottom.

## 5. Component behaviour by size

| Component | < md | ≥ md |
|---|---|---|
| Modal | Full-height bottom sheet, drag handle, sticky footer | Centred, 480/640px, max-height 80vh |
| Drawer | Bottom sheet at 90% height | Right panel, 420–480px |
| Select (>5 options) | Bottom sheet, 48px rows | Anchored popover, 36px rows |
| Date picker | Bottom sheet, one month | Popover; two months for ranges |
| Search | Full-screen view with keyboard raised | Inline field with a results popover |
| Buttons | Primary full-width, 56px, in the thumb zone | Inline auto-width, 44px, right-aligned |
| Metric cards | 2-up | 4-up |
| Approval card actions | Stacked full-width: Approve, Reject, Ask for details | Inline row, primary left |
| Tabs | Scrollable, max 5, active scrolled into view | Left-aligned with counts |

## 6. Zoom, reflow and orientation
- 320px reflow with no horizontal scrolling (WCAG 1.4.10) — 360px is the design baseline but nothing may break at 320.
- 200% browser zoom loses no content or function.
- Landscape phones: the check-in action stays reachable without scrolling; the clock shrinks before the button does.
- Sticky bars use `scroll-padding` so a focused field is never hidden behind them (WCAG 2.2 Focus Not Obscured).
- Bottom nav respects `env(safe-area-inset-bottom)`.

## 7. Never
- Never hide approval state, exception reasons, payroll impact or audit information on small screens.
- Never replace a status chip with a bare colour dot to save space.
- Never place a primary action above the fold on desktop but below three scrolls on mobile.
- Never rely on hover to reveal an action that mobile users also need.
