# STF Icon Style Guide — v1.0

## 1. Approved library
**Lucide** (ISC licence, ~1,500 icons, actively maintained, available for React/Vue/Svelte/web-component and raw SVG).

Rationale: geometric, open, 24px-grid stroke icons that sit correctly beside Schibsted Grotesk and Wix Madefor Text; permissive licence; no attribution burden; one dependency instead of a bespoke set. **Do not build a custom icon set.**

Approved fallback if Lucide is unavailable in the chosen stack: **Phosphor Icons (regular weight)**. Never mix two libraries in one build.

## 2. Style rules
| Property | Value |
|---|---|
| Grid | 24×24 |
| Stroke | 1.75px default; 2px inside primary mobile actions and empty-state art |
| Caps / joins | Round |
| Fill | None (stroke only). Solid fills only for the active bottom-nav indicator dot and status dots. |
| Corner radius | Inherit Lucide geometry; do not redraw |
| Sizes | 16 (inline/caption), 20 (dense tables, chips), 24 (default UI, nav), 28 (mobile primary action), 40–56 (empty-state art) |
| Colour | `currentColor` only — inherits text token; never a hard-coded hex |
| Optical alignment | Icon + label gap = `space.2` (8px); vertically centred on cap height, not bounding box |
| Rotation/mirroring | Not permitted except chevrons (direction) and refresh (loading spin) |

## 3. Accessibility
- Decorative icon beside a text label → `aria-hidden="true"`.
- Icon-only button → `aria-label` with the same words the tooltip shows, and a visible tooltip on hover/focus.
- Never use an icon as the only carrier of status meaning — status is text + colour + optional icon.
- Minimum icon-button hit area: 48×48 mobile, 40×40 desktop, regardless of glyph size.

## 4. Custom SVG — the only approved exceptions
1. `STF-app-icon.svg` / `STF-favicon.svg` / logo files (`01-brand/`) — the brand mark.
2. **Geofence status glyph** — a dot inside a soft circle boundary, needed because every library alternative reads as a surveillance map pin. 24×24, stroke 1.75, `currentColor`.
3. **Empty-state and success illustrations** — compositions built only from circles, rounded rectangles and the three logo bars, in brand + warm tokens. No characters, no scenes, no drawn people.

Anything beyond these three requires written approval and an entry in `08-claude-code-handoff/design-decisions.md`.

## 5. Forbidden imagery
Weapons, shields, badges of authority, handcuffs, CCTV cameras, eyes, radar/tracking pings, fingerprints, face-scan frames, religious or political symbols, national emblems, flags, gavel/scales (legal implication), and emoji anywhere in the product UI.
