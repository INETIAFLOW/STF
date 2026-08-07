# STF Asset Manifest — v1.0

Every file in `STF-Design-Handoff-v1.zip`. If something referenced here is missing, stop and request it before implementing.

## 01-brand/ (11 files)
| File | Type | Notes |
|---|---|---|
| `STF-logo-primary.svg` | SVG, 232×44 | Default, light backgrounds. Wordmark is live text — outline before print use. |
| `STF-logo-light.svg` | SVG | Alias of primary |
| `STF-logo-dark.svg` | SVG | Dark/navy backgrounds |
| `STF-logo-monochrome.svg` | SVG | Uses `currentColor`; print, payslips, one-colour |
| `STF-app-icon.svg` | SVG, 512×512 | Export PNG at 1024/512/192/180/144/96/48 |
| `STF-favicon.svg` | SVG, 32×32 | Also export 32/16 PNG + `.ico` |
| `brand-guidelines.md` | doc | Brand core, dual-surface model, warm accent policy |
| `logo-usage.md` | doc | Clear space, minimum sizes, backgrounds, prohibitions |
| `color-palette.md` | doc | Every colour with hex, usage and verified contrast ratio |
| `typography.md` | doc | Families, loading method, mobile/desktop scales, rules |
| `voice-and-microcopy.md` | doc | Voice rules, vocabulary, fixed status strings, all core copy |

**Derived assets to generate at build time** (not in the ZIP): PNG app icons at the sizes above, `favicon.ico`, Apple touch icon 180×180, maskable Android icon with 20% safe padding, and an OG/social image 1200×630 using the dark logo on `#0E1230`.

## 02-design-tokens/ (9 files)
`tokens.json` (root index, everything flattened) · `colors.json` · `typography.json` · `spacing.json` · `radius.json` · `shadows.json` · `breakpoints.json` · `motion.json` · `design-tokens.md`
Every colour token carries a light `value` and a `dark` value. Light is the designed theme.

## 03-icons/ (2 files)
`icon-style-guide.md` — Lucide (ISC) is the approved library; style rules; the three permitted custom SVGs.
`icon-to-feature-map.md` — every STF feature mapped to a named Lucide icon.

**Icons are not bundled** — install Lucide from npm at the version you pin. Do not copy individual SVGs into the repo except the three permitted custom ones.

## 04-components/ (3 files)
`component-specifications.md` — 30 components, each with anatomy, variants, sizes, tokens, mobile, desktop, accessibility.
`component-states.md` — universal state rules, precedence order, per-component matrix, reduced motion.
`accessibility.md` — WCAG 2.2 AA standard, non-negotiables, per-screen test checklist.

## 05-screen-designs/ (5 files)
| File | Contains |
|---|---|
| `STF-Employee-Screens.dc.html` | 19 employee canvases covering 20 screens, 360px baseline |
| `STF-Admin-Screens.dc.html` | 10 admin operations canvases covering 13 screens, 1280px |
| `STF-Admin-Config-Screens.dc.html` | 7 canvases covering 11 payroll/governance/config screens |
| `STF-Marketing-Screens.dc.html` | 6 marketing canvases |
| `STF-Brand-Directions.dc.html` | The three explored directions + comparison. **Reference only** — Disha (1c) was selected. |

Each is a normal HTML file that loads the sibling `support.js` in the same folder — keep them together. Open directly in a browser; zoom out to see a full set. They are **specifications to read measurements and copy from**, not code to copy into the product.

## 06-user-flows/ (3 files)
`user-flows.md` (10 flows) · `edge-cases.md` · `empty-loading-error-states.md`

## 07-responsive-rules/ (3 files)
`responsive-layouts.md` · `mobile-first-guidelines.md` · `desktop-admin-guidelines.md`

## 08-claude-code-handoff/ (7 files)
`README-FOR-CLAUDE-CODE.md` · `design-system-implementation-guide.md` · `screen-inventory.md` · `asset-manifest.md` · `design-decisions.md` · `copy-deck.md` · `acceptance-checklist.md`

## Fonts — not bundled, licence permits self-hosting
| Family | Licence | Source |
|---|---|---|
| Schibsted Grotesk | SIL OFL 1.1 | Google Fonts |
| Wix Madefor Text | SIL OFL 1.1 | Google Fonts |
| Spline Sans Mono | SIL OFL 1.1 | Google Fonts |
Download WOFF2, subset latin + latin-ext, self-host. Keep the licence files alongside the fonts in the repo.

## Imagery — not included
No photography or illustration is supplied. Photography direction is in `01-brand/brand-guidelines.md` §8: authentic Indian SME work contexts, people shown with dignity. Empty-state and success illustrations are to be built from the geometric rules in `04-components/component-specifications.md` §22 — do not source stock illustration.

`support.js` (shared runtime for the five HTML files) is included in the same folder.

**Totals: 44 files across 8 folders.**
