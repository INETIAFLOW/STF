# STF Component States — v1.0

Universal rules first, then a per-component matrix. Tokens from `../02-design-tokens/`.

## 1. Universal state rules
| State | How it is expressed |
|---|---|
| **Default** | Resting tokens as specified per component. |
| **Hover** | Desktop only (`@media (hover: hover)`). One step of change: background to `color.surface.sunken`, or border `default`→`strong`, or shadow `elevation.1`→`2`. `motion.duration.fast`. Never a size change. |
| **Focus-visible** | 2px solid `color.border.focus` outline with 2px offset **plus** `shadow.focusRing`. Identical on mouse and keyboard when triggered by keyboard. Never removed, never replaced by colour alone. Danger controls use `shadow.focusRingDanger`. |
| **Active / pressed** | `motion.duration.instant`; fills darken one step (`primaryHover`→`primaryActive`); max scale 0.98; no ripple. |
| **Selected** | `color.brand.primarySubtle` background **plus** a non-colour marker (checkmark, 3px indicator bar, or `aria-pressed`). |
| **Disabled** | `color.surface.disabled` bg, `color.text.disabled` text, no shadow, `cursor: not-allowed`, `aria-disabled`. **Always accompanied by a reason** in adjacent text or a tooltip. Never the only explanation for why a user cannot act. |
| **Loading** | Dimensions locked; label replaced by a spinner or the region replaced by a skeleton; `aria-busy="true"`; the control is inert but still focusable so focus is not lost. |
| **Error** | `status.error` border/tint + a text message that says what to do next + `aria-invalid` + `aria-describedby`. |
| **Read-only** | `color.surface.sunken`, no border, `color.text.primary` text, focusable and copyable, no edit affordance. |
| **Empty** | See Empty state; every empty region explains itself and offers a next step or a reassurance. |
| **Offline / queued** | Neutral `Waiting to send` chip + `cloud-off` icon; the action already taken is shown as done locally and is never reverted silently. |

**Precedence when states collide:** disabled > loading > error > selected > active > hover > default. A disabled control never shows hover or error styling.

## 2. Per-component matrix

### Buttons
| State | Primary | Secondary | Outline | Danger | Warm (employee) |
|---|---|---|---|---|---|
| Default | `brand.primary` / white | `brand.primarySubtle` / `brand.primary` | white / `text.primary`, 1.5px `border.strong` | `status.error.fg` / white | `warm.accent` / white |
| Hover | `brand.primaryHover` | `#DDE3F9` | bg `surface.sunken`, border `border.focus` | darken 8% | darken 8% |
| Focus | + focus ring | + focus ring | + focus ring | + danger focus ring | + focus ring |
| Active | `brand.primaryActive`, scale .98 | `#D3DAF6` | bg `#EDEEF4` | darken 14% | darken 14% |
| Disabled | `surface.disabled` / `text.disabled` | same | same, border `border.default` | same | same |
| Loading | spinner, width locked, label hidden | same | same | same | same |

Destructive buttons never enter a loading state without a preceding impact confirm.

### Inputs / textarea / search
Default 1.5px `border.default` → Hover `border.strong` → Focus 2px `border.focus` + ring → Filled (value present, `text.primary`) → Error 1.5px `status.error.fg` + message + `aria-invalid` → Success (only after async validation that matters, e.g. phone available: 1.5px `status.success.fg` + short confirmation) → Disabled `surface.disabled`, label `text.disabled` → Read-only `surface.sunken`, no border → Loading (async check) trailing 16px spinner, field stays editable.
Validation timing: on blur for format, on submit for required, live only for character counters and OTP length.

### Select / dropdown
Trigger mirrors Input. List: option default → hover `surface.sunken` → focused (keyboard) `surface.sunken` + 2px inset focus ring → selected `brand.primarySubtle` + `check` → disabled option `text.disabled` with a reason → loading options skeleton rows → empty "No matches for 'xyz'" → error "Couldn't load branches. Retry."

### Date picker
Day cell: default → hover `surface.sunken` → today 1.5px `border.strong` outline → selected `brand.primary` + white → in-range `brand.primarySubtle` → range endpoints `brand.primary` → disabled `text.disabled` + reason on tap → status-dotted (attendance calendar) → focused 2px focus ring inside the cell. Locked periods (payroll approved) render disabled with an explanatory footer, never simply missing.

### Checkbox / radio
Unchecked → hover border `border.strong` → focus ring → checked `brand.primary` fill → indeterminate `brand.primary` fill + dash (`aria-checked="mixed"`) → disabled+unchecked `surface.disabled` → disabled+checked `text.disabled` fill → error 1.5px `status.error.fg` + group message.

### Switch
Off (`border.strong` track, word "Disabled") → Off hover track `#B7BFD6` → On (`brand.primary` track, word "Enabled") → Focus ring on the track → **Pending** (governed switches: knob mid-travel is not allowed; instead the switch shows a 16px spinner in place of the knob, the word becomes "Saving…", and the row is `aria-busy`) → Confirmed (state word updates, toast confirms, audit event created) → Failed (switch returns to its previous state, `status.error` inline message "Couldn't enable Payroll. Attendance must be enabled first.") → Locked/no permission (off, `lock` icon, "Ask your company owner", `aria-disabled`) → Dependency-blocked (off, warning icon, "Requires Attendance", tapping opens the dependency explanation rather than doing nothing).

### Tabs
Default `text.secondary` → hover `text.primary` + `surface.sunken` → active `brand.primary` + 2px underline → focus ring on the tab → disabled with reason → with-count badge (count updates via `aria-live="polite"` only when the tab is not active).

### Status chip
Static by default. Interactive (filter) chips add hover `darken bg 4%`, focus ring, and selected = `status.X.fg` border 1.5px + `aria-pressed`. Loading count → skeleton pill of the same width. Chips never animate.

### Cards
Default `elevation.1` → hover (interactive only) `elevation.2` + `border.strong` → focus-visible ring on the whole card → active `elevation.1` + scale .995 → selected `brand.primarySubtle` bg + 2px `brand.primary` border → loading skeleton of the same height → error variant with retry inside the card → disabled/unavailable (module off) 60% opacity + explanatory line, contents not interactive.

### Tables
Row default → hover `surface.sunken` → selected `brand.primarySubtle` → focused row 2px inset focus ring → expanded (chevron rotated, detail panel `surface.sunken`) → editing cell (payroll only: 1.5px `border.focus`, Save/Cancel appear, an audit note is required) → error row (`status.error` left border + reason, e.g. "Salary structure missing") → loading 6 skeleton rows (3 on mobile) → empty state inside the table container with the header retained → sorted header (`arrow-up`/`arrow-down` + `aria-sort`).

### Bottom navigation
Item default `text.tertiary` → active `brand.primary` + 3px top indicator + `aria-current` → pressed background `surface.sunken` (no scale) → badge (count ≤9, then "9+") → hidden (full-screen flow) → module-disabled: item absent and the bar re-balances.

### Sidebar
Item default → hover `surface.sunken` → active `brand.primarySubtle` + 3px left indicator + 600 weight → focus ring → expanded group (chevron + inline children) → collapsed rail (icon + focus tooltip) → module absent when disabled or not permitted (never greyed-out teasing).

### Modal / drawer
Opening (`duration.base` fade + scale .98→1; sheet `duration.sheet` slide) → open (focus trapped, background inert, overlay `surface.overlay`) → submitting (primary loading, other controls disabled, `Esc` blocked) → error inside the modal (banner at the top of the body, focus moved to it, modal stays open) → success (close + toast, or convert to a success panel for employee moments) → closing (reverse) → unsaved-changes guard (secondary confirm; the guard itself is never dismissible by overlay click).

### Toast
Enter (slide 8px + fade, `duration.base`) → visible (timer paused on hover/focus) → action pressed (toast closes only after the action resolves) → error toast persists until dismissed → stack overflow: oldest collapses into "+2 more" rather than scrolling off screen.

### Alert banner
Static. Dismissible variant remembers dismissal per user per context — **except** consequence banners, dependency warnings, unreviewed-payroll warnings and support-session bands, which are not dismissible.

### File upload
Idle → dragover (`brand.primarySubtle` + dashed `border.focus`) → per-file uploading (progress bar + Cancel) → per-file success (thumbnail, name, size, Remove) → per-file error (reason + Retry; siblings unaffected) → too-many/too-large (blocked before upload with the exact limit) → offline (queued, `Waiting to send`) → post-submit read-only (thumbnails viewable, Remove withdrawn once a reviewer has seen the proof).

### Attendance action card
Ready-inside → ready-outside (warning chip, reason field required, button label becomes "Check In — needs approval") → location-off (info chip + instructions, button disabled with the reason stated) → late-consequence (warning consequence banner + minutes in the button's accessible name) → submitting (button loading, taps debounced) → **confirmed** (warm panel, single pulse, action becomes Check Out, elapsed hours start) → checked-out (summary: in, out, total hours, any exception chip) → offline-queued (confirmed locally + `Waiting to send`) → duplicate-tap guard (server time wins and is displayed back) → policy-off (location chip omitted entirely).

### Approval card
Pending → evidence expanded → approving (primary loading, other actions disabled) → approved (success chip + persistent audit line + card moves out of the queue with an Undo window where policy allows) → rejecting (reason required; primary disabled until a reason exists) → rejected (error chip + audit line) → asking-for-details (info chip "Details requested", returns to the requester) → stale (another admin already decided: card locks with "Already approved by Priya at 10:04 AM" and a link to the audit entry) → bulk mode (count + combined impact + per-item exclusion).

## 3. Reduced motion
Under `prefers-reduced-motion: reduce`: no transforms, no scale, no slide; opacity-only transitions at `duration.fast`; skeleton shimmer becomes a static `surface.sunken` tint; the check-in confirmation pulse is replaced by an immediate colour change.
