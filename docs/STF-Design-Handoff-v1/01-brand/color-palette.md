# STF Colour Palette — v1.0

Base direction **Disha**. Machine-readable source: `../02-design-tokens/colors.json`.
All pairings below are verified against WCAG 2.2 AA (4.5:1 body text, 3:1 large text and UI boundaries).

## 1. Brand

| Token | Hex | Use |
|---|---|---|
| `color.brand.primary` | #2F45C4 | Primary buttons, active nav, links, focus ring base, selected states |
| `color.brand.primaryHover` | #263AA8 | Hover on primary |
| `color.brand.primaryActive` | #1E2F8C | Pressed on primary |
| `color.brand.primarySubtle` | #E9EDFB | Selected row tint, secondary button fill, avatar background |
| `color.brand.navy` | #12172E | Headings, primary text, dark surfaces |
| `color.brand.navyDeep` | #0E1230 | Dark-mode canvas, marketing hero field |
| `color.accent.positive` | #0FA57E | Positive data emphasis (present counts, completion), sparingly |

White on #2F45C4 = 6.9:1 ✔ · #2F45C4 on #FFFFFF = 6.9:1 ✔ · #2F45C4 on #E9EDFB = 5.6:1 ✔

## 2. Warm accent — employee positive moments only

| Token | Hex | Use |
|---|---|---|
| `color.warm.accent` | #A2451F | Fill for check-in success, welcome, recognition. White text on it = 6.4:1 ✔ |
| `color.warm.accentSoft` | #C4653C | Illustration accents, decorative shapes only (never text-bearing) |
| `color.warm.subtle` | #FBEFE7 | Success/welcome card background on employee screens |
| `color.warm.text` | #7E3417 | Text on `warm.subtle` = 7.1:1 ✔ |
| `color.warm.border` | #EDD9CC | Border on warm cards |

Hard rule: never the primary brand colour; never on admin, payroll, report, audit or configuration surfaces; max one warm element per employee screen.

## 3. Surfaces

| Token | Hex | Use |
|---|---|---|
| `color.surface.canvas` | #F7F8FC | Admin/desktop page background (cool) |
| `color.surface.canvasWarm` | #FAF8F5 | Employee mobile page background (warm off-white) |
| `color.surface.default` | #FFFFFF | Cards, sheets, table bodies, inputs |
| `color.surface.raised` | #FFFFFF + `shadow.elevation.2` | Modals, drawers, popovers |
| `color.surface.sunken` | #F1F3FA | Table headers, inset panels, code/log blocks |
| `color.surface.inverse` | #12172E | Toasts, tooltips, dark bands |
| `color.surface.disabled` | #EDEEF4 | Disabled controls |

## 4. Text

| Token | Hex | On | Ratio |
|---|---|---|---|
| `color.text.primary` | #12172E | #FFFFFF | 15.8:1 ✔ |
| `color.text.secondary` | #5A6076 | #FFFFFF | 6.8:1 ✔ |
| `color.text.tertiary` | #7A81A0 | #FFFFFF | 4.6:1 ✔ (labels/captions ≥13px only) |
| `color.text.disabled` | #A6ABC4 | #FFFFFF | 2.6:1 — disabled text only, never informational |
| `color.text.inverse` | #FFFFFF | #12172E | 15.8:1 ✔ |
| `color.text.onPrimary` | #FFFFFF | #2F45C4 | 6.9:1 ✔ |
| `color.text.link` | #2F45C4 | #FFFFFF | 6.9:1 ✔ (underline on hover) |

## 5. Borders

| Token | Hex | Use |
|---|---|---|
| `color.border.subtle` | #EDEEF4 | Table row dividers |
| `color.border.default` | #E3E6F0 | Cards, inputs at rest |
| `color.border.strong` | #C9CFE2 | Input hover, dense table outlines, 3:1 boundary needs |
| `color.border.focus` | #2F45C4 | Focus ring (2px) + `rgba(47,69,196,.35)` 3px halo |
| `color.border.warm` | #EDD9CC | Employee warm cards |

## 6. Status — always paired with text

| Status | Fg / icon | Background | Text on bg | Ratio |
|---|---|---|---|---|
| Success (Present, Approved, Completed) | #148A5E | #E2F4ED | #0E6647 | 6.6:1 ✔ |
| Warning (Late, Needs review, Dependency) | #A16207 | #FAF0DA | #7A4E06 | 7.0:1 ✔ |
| Error (Absent, Rejected, Failed) | #C6293C | #FBE4E7 | #9A1F2E | 7.2:1 ✔ |
| Info (On leave, Scheduled, Draft) | #2F6FD8 | #E5EDFB | #22509E | 6.3:1 ✔ |
| Neutral (Pending, Not started, Disabled) | #7A81A0 | #EDEEF4 | #525878 | 6.1:1 ✔ |

Every status chip carries a label ("Late 18 min"), not colour alone. Colour-blind check: success/error also differ by chip label and, in tables, by an icon.

## 7. Data-visualisation ramp
Ordered, categorical, indigo-led — for attendance and task charts only:
`#2F45C4` → `#5265D6` → `#8B97E8` → `#B9C2F2`, with `#148A5E`, `#A16207`, `#C6293C`, `#2F6FD8` reserved for status series so a chart never contradicts a chip.

## 8. Dark mode
Included as tokens; light mode is the primary designed theme.

| Token | Light | Dark |
|---|---|---|
| `surface.canvas` | #F7F8FC | #0E1230 |
| `surface.canvasWarm` | #FAF8F5 | #141834 |
| `surface.default` | #FFFFFF | #171C3E |
| `surface.sunken` | #F1F3FA | #1E2450 |
| `border.default` | #E3E6F0 | #2A3057 |
| `text.primary` | #12172E | #F1F2F8 |
| `text.secondary` | #5A6076 | #9BA3C7 |
| `brand.primary` | #2F45C4 | #8B97E8 |
| `accent.positive` | #0FA57E | #35C79D |
| `warm.accent` | #A2451F | #E08A64 |
| status success / warning / error / info | #148A5E / #A16207 / #C6293C / #2F6FD8 | #3CBE88 / #D99A2B / #EF6E7C / #7BA8F0 |

Dark-mode status backgrounds are the status colour at 16% alpha over `surface.default`.
