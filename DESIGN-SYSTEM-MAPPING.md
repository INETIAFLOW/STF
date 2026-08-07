# Design System → Code Mapping

How the approved design files (`docs/STF-Design-Handoff-v1/`) map into this
codebase. The design documents are authoritative; this file explains where
each contract lives in code.

## Token pipeline (single source)

```
docs/STF-Design-Handoff-v1/02-design-tokens/*.json   (approved source)
        │  copied verbatim
        ▼
design/tokens/*.json
        │  npm run tokens  (scripts/generate-tokens.mjs)
        ▼
src/styles/tokens.css     ← GENERATED, never hand-edited
        │  imported by src/app/globals.css
        ▼
Tailwind v4 utilities (via the @theme block inside tokens.css)
```

Generated exactly as the handoff specifies (README §3, design-tokens.md):

- `:root` carries every token as `--stf-*` custom properties (light theme).
- `[data-theme="dark"]` overrides the **colour block only**.
- One `@media (min-width: 1024px)` block overrides **typography sizes only**.
- Mapping is mechanical: dots → hyphens, camelCase → kebab-case
  (`color.surface.canvasWarm` → `--stf-color-surface-canvas-warm`).
- The `@theme inline` block wipes Tailwind's default colour/radius/shadow/
  type/breakpoint scales (`--color-*: initial` …) and rebuilds them from
  STF tokens, so **no off-token utility exists** (`bg-red-500` does not
  compile to anything).
- Three derived state colours from `component-states.md` §2 were added in
  the generator (not the JSONs) — see DECISIONS.md D-P1-02.

### Utility cheat-sheet

| Design token | Utility |
|---|---|
| `color.brand.primary` | `bg-brand-primary`, `text-brand-primary`, … |
| `color.status.success.bg` | `bg-status-success-bg` |
| `font.size.h1` (+ line-height, weight) | `text-h1` (responsive via the lg media block) |
| Families | `font-heading`, `font-body`, `font-mono` |
| `radius.card` / `radius.cardEmployee` | `rounded-card` / `rounded-card-employee`, or `rounded-surface-card` (context-aware) |
| `shadow.elevation.2` | `shadow-elevation-2` |
| `space.*` (4px base) | numeric utilities (`p-4` = 16px, `gap-5` = 20px) |
| `layout.*` / `touchTarget.*` | `var(--stf-layout-*)` / `var(--stf-touch-*)` |
| Breakpoints 360/480/768/1024/1280/1536 | `xs: sm: md: lg: xl: 2xl:` |
| `motion.*` | duration utilities via `var(--stf-motion-duration-…)`, easings as `ease-standard` … |

## The dual-surface model

`data-surface="employee" | "admin"` is set at the **layout level**
(`src/app/(employee)/layout.tsx`, `src/app/(admin)/admin/layout.tsx`), per
README §1 — never as a component prop.

- Canvas: employee `#FAF8F5` (warm) / admin `#F7F8FC` (cool) — from
  `globals.css` base layer.
- Card radius: `rounded-surface-card` resolves 16px under employee, 12px
  under admin via the `--stf-card-radius` context variable.
- Warm tokens (`warm-*`): employee positive moments only, max one element
  per screen. Forbidden on all admin surfaces.

## Fonts

`src/app/fonts.ts` — self-hosted via `next/font/google` (downloaded at
build, served from our origin; no CDN request at runtime): Schibsted
Grotesk 600/700 (headings), Wix Madefor Text 400/500/600 (body), Spline
Sans Mono 400/500/600 (all numerals; `tabular-nums` enforced globally in
`globals.css`). Fallback stacks are the metric-tolerant sets from
`typography.md`.

## Components

`04-components/component-specifications.md` → `src/components/ui/`:

| Spec § | Component file |
|---|---|
| 1 Buttons | `Button.tsx` (primary/secondary/tertiary/outline/danger/danger-subtle/warm) |
| 2 Icon buttons | `IconButton.tsx` (mandatory label = aria-label + tooltip) |
| 3 Inputs | `Input.tsx` (Input, TextArea; reserved error line) |
| 5 Select | `Select.tsx` (styled native — ≤5 options rule; listbox variant later) |
| 7 Checkboxes | `Checkbox.tsx` (row hit target, indeterminate) |
| 9 Switches | `Switch.tsx` (state word always; governed = pending spinner; locked) |
| 11 Status chips | `StatusChip.tsx` (renders `Status {key,label,tone}` — D-005) |
| 13 Cards | `Card.tsx` (plain/status-led/warm/flush + CardHeader) |
| 14 Tables | `Table.tsx` (real `<table>` + mandatory stacked mobile cards) |
| 15 Bottom nav | `../shell/BottomNav.tsx` (4 items, labels visible, re-balances) |
| 16 Sidebar | `../shell/Sidebar.tsx` (enabled modules only; 240/72px) |
| 17 Top bar | `../shell/TopBar.tsx` (tenant name always visible on admin) |
| 18 Modal | `Modal.tsx` (native dialog; sheet below md; impact-confirm variant in Phase 2) |
| 19 Drawer | `Drawer.tsx` (right panel / bottom sheet) |
| 20 Toast | `Toast.tsx` (success 4s, info 5s, error persistent, pause on hover) |
| 21 Alert | `Alert.tsx` (info/warning/error/success/consequence) |
| 22 Empty state | `EmptyState.tsx` (geometric illustration from logo bars) |
| 23 Loading | `Loading.tsx` (Skeleton, SkeletonRows, 400ms Spinner) |
| 24 Error state | `ErrorState.tsx` (what happened + what next + REF id) |
| 25 File upload | `FileUpload.tsx` (Take Photo/Choose File, dropzone, limits up front) |

STF-specific composites (§26–30: attendance action card, metric card,
employee row, task card, approval card) ship with their business modules —
their contracts (consequence object, approval anatomy) are documented in
ARCHITECTURE.md and the handoff.

## Copy

Product strings come from `08-claude-code-handoff/copy-deck.md` verbatim.
Fixed status labels live in `src/lib/status.ts` and are pinned by
`src/tests/status.test.ts` — a paraphrase fails CI.

## Icons

Lucide only (`lucide-react`), `currentColor`, sizes per
`03-icons/icon-style-guide.md`. The three permitted custom SVGs: brand
marks (`public/brand/`), the geofence glyph and geometric empty-state art
(drawn in `EmptyState.tsx`). No other custom icons.

## Brand assets

`public/brand/` holds the six approved SVGs, copied unmodified. Usage
rules in `01-brand/logo-usage.md` (no recolouring, no extra bars, symbol
only below 112px, monochrome for print/payslips).
