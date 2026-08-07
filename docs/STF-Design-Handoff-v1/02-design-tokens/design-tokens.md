# STF Design Tokens — v1.0

## 1. Files
| File | Contains |
|---|---|
`tokens.json` | Everything, flattened into one root index. Use this if your build takes a single source. |
`colors.json` | `color.*` — brand, warm, surface, text, border, status, chart. Light + `dark` value on every token. |
`typography.json` | `font.*` — families, weights, and every size with paired mobile/desktop px + line-height. |
`spacing.json` | `space.*` (4px base), `layout.*`, `touchTarget.*` |
`radius.json` | `radius.*` including the two card radii (admin 12 / employee 16) |
`shadows.json` | `shadow.elevation.0–4`, action shadows, focus rings |
`breakpoints.json` | `breakpoint.*` + the intent of each step |
`motion.json` | `motion.duration.*`, `motion.easing.*`, usage and reduced-motion rules |

## 2. Naming contract
`category.group.role[.state]` — e.g. `color.brand.primary`, `color.surface.default`, `color.text.primary`, `color.status.success.bg`, `space.4`, `radius.card`, `font.size.body`, `shadow.elevation.2`, `motion.duration.base`.

Rules:
1. **Semantic, never literal.** `color.status.success`, never `color.green500`. There is no numeric colour ramp in this system by design — it prevents "pick any blue" drift.
2. Every colour token carries both a light `value` and a `dark` value. Light is the designed theme; dark is derived and must not be hand-tuned per screen.
3. Status colours come in a four-part set: `.fg` (icon/emphasis), `.bg` (chip/banner fill), `.text` (text on `.bg`), `.border`. Never mix parts across statuses.
4. Sizes are always a pair (`mobile`, `desktop`) resolved at `breakpoint.lg`. There is no fluid clamp for product UI; marketing pages may clamp `display` only.
5. No component may introduce a raw hex, px radius, or shadow that is not a token. If something is missing, add a token and log it in `design-decisions.md`.

## 3. Implementation shape (reference only — not application code)
Recommended: emit CSS custom properties on `:root`, with `[data-theme="dark"]` overriding only the colour block, and a single `@media (min-width: 1024px)` block overriding the typography sizes.

```
--color-brand-primary: #2F45C4;
--color-surface-canvas: #F7F8FC;
--space-4: 16px;
--radius-card: 12px;
--shadow-elevation-2: 0 1px 3px rgba(18,23,46,.08), 0 1px 2px rgba(18,23,46,.04);
```
Token → CSS var mapping is mechanical: dots become hyphens, camelCase becomes kebab-case (`color.surface.canvasWarm` → `--color-surface-canvas-warm`).

## 4. The two surface families
This system deliberately carries **two canvases and two card radii**:

| | Admin / owner | Employee |
|---|---|---|
| canvas | `color.surface.canvas` | `color.surface.canvasWarm` |
| card radius | `radius.card` | `radius.cardEmployee` |
| warm tokens | forbidden | permitted, one element per screen |
| type scale | desktop | mobile |

Implement this as a layout-level attribute (e.g. `data-surface="admin" | "employee"`), not as per-component props. A component must look correct in both without a variant flag, except where `component-specifications.md` states otherwise.

## 5. Theming for tenants
V1 allows a tenant to upload a logo only. Tenant colour theming, white-label domains and custom fonts are **backlog, not V1** — do not build a runtime colour override path.

## 6. Accessibility guarantees baked into the tokens
- Every `text.*` on its intended surface, and every `status.*.text` on its `status.*.bg`, meets AA (ratios listed in `../01-brand/color-palette.md`).
- `color.text.disabled` and `color.text.tertiary` are the only sub-4.5:1 text tokens; `tertiary` is limited to ≥13px non-essential labels, `disabled` to disabled controls.
- `shadow.focusRing` is always paired with a 2px `color.border.focus` outline so focus survives forced-colours/high-contrast mode.
- `touchTarget.employeeMin` = 48px is a hard floor, not a guideline.
