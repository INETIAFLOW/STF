# STF Typography — v1.0

Machine-readable source: `../02-design-tokens/typography.json`

## 1. Families

| Role | Family | Fallback stack | Weights loaded |
|---|---|---|---|
| Headings, buttons, nav | **Schibsted Grotesk** | `"Schibsted Grotesk", "Helvetica Neue", Helvetica, Arial, sans-serif` | 600, 700 |
| Body, UI, labels | **Wix Madefor Text** | `"Wix Madefor Text", "Helvetica Neue", Helvetica, Arial, sans-serif` | 400, 500, 600 |
| Data: time, hours, money, IDs | **Spline Sans Mono** | `"Spline Sans Mono", ui-monospace, "SF Mono", Menlo, monospace` | 400, 500, 600 |

All three are open-licence (SIL OFL) Google Fonts — safe for product, marketing and payslip PDFs.

**Why:** Schibsted Grotesk gives crisp, slightly technical headlines that read as fintech-precise. Wix Madefor Text is screen-optimised with open apertures — critical for non-technical readers on low-cost Android displays. Spline Sans Mono keeps times, hours and salary figures in strict vertical columns so a number never appears to shift between rows.

## 2. Loading method
Self-host WOFF2, subset **latin + latin-ext**, `font-display: swap`, preload the two most critical faces:
```
Wix Madefor Text 400 · Schibsted Grotesk 700   ← preload
Wix Madefor Text 500/600 · Schibsted Grotesk 600 · Spline Sans Mono 400/500/600  ← swap
```
Do not load from the Google Fonts CDN in production (offline-first mobile use, and predictable payslip PDF rendering). Enable `font-variant-numeric: tabular-nums` globally on `Spline Sans Mono` and on any Wix Madefor Text numeral inside a table.

## 3. Mobile type scale (base 360px)

| Token | px / line-height | Weight | Use |
|---|---|---|---|
| `font.size.display` | 32 / 38 | 700 SG | Login title, marketing hero on mobile |
| `font.size.h1` | 26 / 32 | 700 SG | Screen title |
| `font.size.h2` | 20 / 26 | 700 SG | Section heading, card title |
| `font.size.h3` | 17 / 24 | 600 SG | Sub-section, list group label |
| `font.size.bodyLg` | 17 / 26 | 400 WM | Primary reading text, task description |
| `font.size.body` | 16 / 24 | 400 WM | Default body and input text |
| `font.size.label` | 14 / 20 | 600 WM | Field labels, chips, tab labels |
| `font.size.secondary` | 14 / 20 | 400 WM | Supporting text |
| `font.size.caption` | 13 / 18 | 400/500 WM | Timestamps, helper text — **absolute floor** |
| `font.size.dataXl` | 32 / 36 | 600 SSM | Clock on check-in screen |
| `font.size.dataLg` | 22 / 28 | 600 SSM | Metric values, payslip net pay |
| `font.size.data` | 15 / 22 | 500 SSM | Times, hours, amounts in rows |
| `font.size.mono` | 12 / 18 | 500 SSM | IDs, audit stamps, micro-labels |

## 4. Desktop type scale (≥1024px)

| Token | px / line-height | Weight | Use |
|---|---|---|---|
| `font.size.display` | 48 / 54 | 700 SG | Marketing hero |
| `font.size.h1` | 32 / 40 | 700 SG | Page title |
| `font.size.h2` | 22 / 30 | 700 SG | Panel title |
| `font.size.h3` | 16 / 24 | 600 SG | Card / table-group title |
| `font.size.body` | 15 / 23 | 400 WM | Body and form text |
| `font.size.label` | 13 / 18 | 600 WM | Labels, column headers, chips |
| `font.size.caption` | 12 / 17 | 400 WM | Helper, meta — desktop floor, never for status text |
| `font.size.data` | 14 / 20 | 500 SSM | Table numerics |
| `font.size.dataLg` | 28 / 34 | 600 SSM | Metric card values |

Marketing pages may use `display` at 56–64px; product UI may not.

## 5. Practical rules
1. **Weights:** 700 headings, 600 buttons/labels/nav, 500 data and emphasis, 400 body. No 300 or lighter, ever.
2. **Case:** sentence case for all headings, buttons, labels and nav. UPPERCASE only for 12px micro-labels with `letter-spacing: 0.08em` (table column headers, audit stamps). Never uppercase a full sentence.
3. **Letter-spacing:** −0.3px on Schibsted Grotesk ≥26px; 0 elsewhere; +0.08em on uppercase micro-labels only.
4. **Measure:** 60–75 characters max for reading text; on mobile, cap paragraphs at ~45 characters per line via container padding, not `max-width` hacks.
5. **Numbers:** every time, duration, count, percentage and rupee amount uses Spline Sans Mono with tabular figures. Currency written `₹42,800` (Indian grouping: `₹1,42,800`).
6. **Truncation:** employee names truncate with ellipsis at one line in tables and never in approval or payroll contexts — wrap instead.
7. **Localisation headroom:** all labels must survive a 30% length increase without breaking layout (future Hindi/Marathi packs are backlog, but layouts must not assume English lengths).
8. **`text-wrap: pretty`** on all headings and paragraphs; `text-wrap: balance` on hero and card titles.
9. Minimum interactive text 14px mobile / 13px desktop. Status text is never below 12px and never below `label` weight.
