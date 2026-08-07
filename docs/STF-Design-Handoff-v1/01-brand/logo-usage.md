# STF Logo Usage — v1.0

## 1. The symbol
Three rounded bars stepping forward, each offset to the right and increasing in weight of colour.

**Meaning:** work moving through its states — *assigned → in progress → done*. The forward stagger reads as direction (Disha) without arrows, weapons, badges, surveillance pins, or religious/political imagery. It also resolves as an abstract "S".

**Why it works small:** three solid shapes, one axis of motion, no fine detail. Legible at 16px and in one colour.

## 2. Files

| File | Use |
|---|---|
| `STF-logo-primary.svg` | Default. Light backgrounds. Symbol + wordmark. |
| `STF-logo-light.svg` | Alias of primary (for light-background builds). |
| `STF-logo-dark.svg` | Dark/navy backgrounds. White top bar, indigo tints below. |
| `STF-logo-monochrome.svg` | Single colour, uses `currentColor`. Print, payslips, faxed/stamped documents, embroidery, engraving. |
| `STF-app-icon.svg` | 512×512 rounded-square icon, indigo field. Export PNG at 1024/512/192/180/144/96/48. |
| `STF-favicon.svg` | 32×32 optimised symbol-only mark. Also export 32/16 PNG + `.ico`. |

**Wordmark note for implementation:** the wordmark in the SVG files is live text set in *Schibsted Grotesk 700* (descriptor in *Spline Sans Mono 500*). Before any external/print use, outline the text to paths so rendering is font-independent. Keep the live-text version for web where the font is already loaded.

## 3. Clear space & minimum sizes
- Clear space on all sides = the height of one logo bar (≈ 16% of symbol height). Nothing enters it.
- Minimum widths: full logo **112px** digital / 28mm print. Below that use the symbol alone.
- Symbol alone minimum **16px**. Favicon variant below 24px.
- App icon: never add an extra outer stroke, drop shadow, or gradient. The rounded square is part of the mark.

## 4. Backgrounds
- **Light** (#FFFFFF, #F7F8FC, #FAF8F5): primary logo.
- **Dark** (#0E1230, #12172E): dark logo.
- **Indigo brand field** (#2F45C4): dark logo (white/tint bars), wordmark white.
- **Photography:** only on a calm, uncluttered area; if contrast is under 4.5:1, place the logo on a solid indigo or white plate.

## 5. Lock-ups
- Horizontal lock-up (symbol left, wordmark right) is the only approved arrangement for V1.
- A stacked lock-up may be added later by approval; do not improvise one.
- Product sub-brands ("STF Payroll") are **not approved** for V1. Use plain module names inside the product UI instead.

## 6. Never
- Recolour the bars outside the approved palettes (no terracotta logo — warmth never touches the mark).
- Rotate, skew, arch, outline, add gradients or shadows, or animate the mark into a loading spinner.
- Place the wordmark in another typeface, letterspace it manually, or set it in all caps.
- Reproduce the mark with fewer or more than three bars, or equalise the stagger.
- Use the logo inside a sentence in place of the words "Sudarshan Task Force".

## 7. In-product placement
- Desktop admin: sidebar top-left, symbol + wordmark, 26px symbol height.
- Employee mobile: symbol only in the top bar; full logo on login and splash.
- Payslips and exported reports: monochrome logo, top-left, plus tenant company name — the tenant's identity leads, STF is the system of record.
