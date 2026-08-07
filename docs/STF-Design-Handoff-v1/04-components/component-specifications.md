# STF Component Specifications — v1.0

Base direction **Disha**. Every value below is a token from `../02-design-tokens/`. No component may introduce a raw hex, radius or shadow.

**Surface context.** Components render inside `data-surface="admin"` or `data-surface="employee"`. That attribute alone changes canvas, card radius and type scale. Components do not need per-surface variants unless stated.

**How to read a spec:** Anatomy → Variants → Sizes → Tokens → Mobile → Desktop → Accessibility. States for every component are in `component-states.md`.

---

## 1. Buttons

**Anatomy** — `[optional leading icon 20px] label [optional trailing icon 20px]`, centred, single line, never wraps.

**Variants**
| Variant | Fill | Text | Border | Use |
|---|---|---|---|---|
| Primary | `color.brand.primary` | `color.text.onPrimary` | none | One per screen or per card. The main action. |
| Secondary | `color.brand.primarySubtle` | `color.brand.primary` | none | Paired action next to primary (Review, Cancel-safe) |
| Tertiary / ghost | transparent | `color.brand.primary` | none | Low-emphasis inline actions ("View all") |
| Outline | `color.surface.default` | `color.text.primary` | 1.5px `color.border.strong` | Neutral action on a card (Reject-adjacent, Filter) |
| Danger | `color.status.error.fg` | `#FFFFFF` | none | Irreversible or negative: Reject, Disable module |
| Danger-subtle | `color.status.error.bg` | `color.status.error.text` | 1px `color.status.error.border` | Danger in a dense list where a solid red would shout |
| Warm success (employee only) | `color.warm.accent` | `#FFFFFF` | none | Check-in confirm, welcome CTA. **Never on admin.** |

**Sizes**
| Size | Height | Padding-x | Font | Radius | Where |
|---|---|---|---|---|---|
| sm | 36px | `space.3` | `font.size.label` | `radius.button` | Dense admin tables, chips row |
| md | 44px | `space.5` | `font.size.label` | `radius.button` | Default desktop |
| lg | 48px | `space.6` | `font.size.body` 600 | `radius.button` | Employee mobile default |
| xl | 56px | `space.6` | `font.size.h3` | `radius.buttonMobilePrimary` | Mobile primary action, full-width |

**Tokens** — shadow: primary at xl uses `shadow.primaryAction`; all other buttons `shadow.elevation.0`. Focus: 2px `color.border.focus` + `shadow.focusRing` (danger uses `shadow.focusRingDanger`).

**Mobile** — primary action is full-width, `size.xl`, inside the thumb zone (bottom `layout.thumbZoneBottom`). Max two buttons side by side; a third goes to a second row. Sticky action bars sit on `color.surface.default` with a 1px top border and safe-area padding.

**Desktop** — buttons are inline auto-width, `size.md`, right-aligned in cards and modals with `space.3` gap; primary is right-most. Never full-width above `breakpoint.md` except inside a 320px drawer.

**Accessibility** — real `<button>`; label is a verb phrase (see `voice-and-microcopy.md`); min 48×48 employee / 40×40 admin including padding; disabled buttons keep 3:1 boundary contrast and are accompanied by a reason ("Approve — needs a reason first"); loading state keeps the button width fixed to prevent layout shift.

---

## 2. Icon buttons

**Anatomy** — 24px Lucide glyph in a square hit area, no label, tooltip on hover/focus.
**Variants** — ghost (default), filled (`color.surface.sunken`), danger-ghost, inverse (on `color.surface.inverse`).
**Sizes** — 48×48 mobile (`touchTarget.iconButtonMobile`), 40×40 desktop, 32×32 in dense table rows *only when the row itself is ≥48px tall*.
**Tokens** — radius `radius.md`; hover `color.surface.sunken`; icon `color.text.secondary`, `color.text.primary` on hover.
**Mobile** — reserve for back, close, more, camera. Never use an icon button for a decision (Approve/Reject always carry text).
**Desktop** — allowed for row-level actions with a visible tooltip; a row must never have more than three.
**Accessibility** — `aria-label` required and identical to the tooltip text; glyph `aria-hidden`; tooltip appears on keyboard focus, not hover only; icon-only Approve/Reject is **prohibited**.

---

## 3. Inputs (text, number, phone, textarea)

**Anatomy** — label (`font.size.label`, `color.text.primary`) → optional helper (`font.size.caption`, `color.text.secondary`) → field → error/helper line reserved (fixed 20px) so validation never shifts layout.
**Variants** — text, phone (10-digit, `+91` prefix chip, mono digits), number/amount (mono, right-aligned, `₹` prefix), textarea (min 3 rows, auto-grow to 8), read-only (`color.surface.sunken`, no border, copy icon).
**Sizes** — mobile 52px, desktop 40px; textarea by rows. Padding `space.4` mobile / `space.3` desktop.
**Tokens** — bg `color.surface.default`; border 1.5px `color.border.default`, hover `color.border.strong`, focus 2px `color.border.focus` + `shadow.focusRing`; radius `radius.input`; text `font.size.body`; placeholder `color.text.tertiary` (placeholder is an example, never the label).
**Mobile** — correct `inputmode` (`numeric` for phone/amount/OTP), 16px+ font so iOS does not zoom, single column always, labels above fields never floating.
**Desktop** — two-column forms allowed at `breakpoint.lg`; related fields (from/to date) share a row; max field width 480px for readability.
**Accessibility** — `<label for>` always (no placeholder-as-label); required marked with the word "Required", not an asterisk alone; errors use `aria-describedby` + `aria-invalid`; error text says what to do next; never disable paste on OTP or amount fields.

---

## 4. Search

**Anatomy** — `search` icon 20px → input → clear (`x`) when non-empty → optional result count.
**Variants** — inline (admin header, 280px), full-width (mobile screen top), command-style employee-directory search with recent items.
**Tokens** — as Input; icon `color.text.tertiary`; radius `radius.input`.
**Behaviour** — debounce 250ms; minimum 2 characters; searches name **and phone number** (SME admins look people up by phone); results highlight the matched substring with `color.brand.primarySubtle` background; keyboard `↑ ↓ Enter Esc`.
**Mobile** — search opens as its own full-screen view with the keyboard raised and results in a stacked list; never a 200px-wide field squeezed into a header.
**Desktop** — inline with results in a popover (`shadow.elevation.3`), max 8 rows then "See all results".
**Accessibility** — `role="combobox"` + `aria-expanded` + `aria-activedescendant`; result count announced politely ("6 employees found"); empty result gives the copy from `voice-and-microcopy.md` §9.

---

## 5. Select / dropdown

**Anatomy** — label → trigger (value + `chevron-down`) → list (checkmark on selected).
**Variants** — single, multi (checkboxes + "3 selected" summary), grouped (by branch/department), searchable (>8 options — mandatory).
**Sizes** — trigger identical to Input. Option row 48px mobile / 36px desktop.
**Tokens** — list `color.surface.raised` + `shadow.elevation.3`, radius `radius.md`; selected row `color.brand.primarySubtle`; hover `color.surface.sunken`.
**Mobile** — opens as a bottom sheet (`radius.sheet` top corners, drag handle, title, 48px rows, sticky Done for multi). Native `<select>` is acceptable only for ≤5 short neutral options.
**Desktop** — anchored popover, max-height 320px, scrolls, closes on outside click and `Esc`, returns focus to the trigger.
**Accessibility** — `role="listbox"`/`option`, full arrow-key support, type-ahead, selection announced; never rely on colour alone to show selection (checkmark required).

---

## 6. Date picker

**Anatomy** — trigger (`calendar-days` + formatted date) → month grid with weekday header → footer (Today / Clear / Apply).
**Variants** — single date, range (leave from–to, payroll period), month-only (payroll period, attendance month), with-time (task due date + optional time frame).
**Format** — display `Fri, 7 Aug 2026`; range `7 – 9 Aug 2026`; ISO in payloads only. Week starts **Monday**. Indian date order everywhere; never MM/DD.
**Tokens** — day cell 44px mobile / 36px desktop, radius `radius.chip`; selected `color.brand.primary` + `color.text.onPrimary`; in-range `color.brand.primarySubtle`; today outlined 1.5px `color.border.strong`; disabled `color.text.disabled`.
**Behaviour** — day cells show attendance status dots on the employee attendance calendar (`status.*.fg`, 6px, max one per day); unavailable dates disabled with a reason on tap ("Payroll for July is locked").
**Mobile** — bottom sheet, one month at a time, swipe or chevrons; typing a date is also allowed.
**Desktop** — popover; range shows two months side by side.
**Accessibility** — `role="grid"`, arrow/PageUp/PageDown/Home/End, `aria-label` per day with full date **and status** ("7 August 2026, Present"), selected range announced, always keyboard-completable without opening the calendar.

---

## 7. Checkboxes

**Anatomy** — 22px mobile / 18px desktop box + label + optional helper; whole row is the hit target (min 48px mobile).
**Variants** — single, group, indeterminate (parent of partially-selected list, e.g. "Select all employees"), card-checkbox (bordered selectable card for payroll employee selection).
**Tokens** — unchecked 1.5px `color.border.strong` on `color.surface.default`, radius `radius.xs`; checked `color.brand.primary` fill + white `check`; focus ring as standard; error 1.5px `color.status.error.fg` + message.
**Mobile / Desktop** — always vertical stacks with `space.3` gap; never inline-wrapped.
**Accessibility** — native `<input type=checkbox>`; indeterminate exposed via `aria-checked="mixed"`; group wrapped in `<fieldset><legend>`; label click toggles.

---

## 8. Radio buttons

Same metrics as Checkbox with `radius.pill` and a 8px inner dot.
**Variants** — list (default, ≤5 options), segmented card (2–3 visual choices, e.g. Half day / Full day), inline segmented control (Present / Absent / Half Day in a correction form).
**Rule** — radio for mutually exclusive with ≤5 options; above that use Select. Never pre-select a consequential option (leave type, payroll adjustment) — force a deliberate choice.
**Accessibility** — one `<fieldset><legend>`; arrow keys move and select within the group; roving tabindex.

---

## 9. Switches

**Anatomy** — track 44×26 mobile / 40×24 desktop, knob 22/20, label left, state word right or below.
**Rule (critical)** — a switch **always** shows its state as a word: `Enabled` / `Disabled`. Colour alone is never the signal.
**Tokens** — off track `color.border.strong`, on track `color.brand.primary`, knob `#FFFFFF` + `shadow.elevation.1`, transition `motion.duration.fast`.
**Variants** — inline (notification preferences: applies immediately, toast confirms), **governed** (Module Management / feature flags: opens a confirmation with impact before applying — see Modal), locked (no permission: shown off + `lock` + "Ask your company owner").
**Mobile** — full-row layout, switch right-aligned, row min 56px, description under the label.
**Desktop** — same, inside module cards or settings rows.
**Accessibility** — `role="switch"` + `aria-checked`; the accessible name includes the object ("Attendance module, Enabled"); governed switches must not change visual state until the server confirms — show loading on the switch instead.

---

## 10. Tabs

**Variants** — underline (default, section navigation), segmented pill (2–3 filters, e.g. Pending / Approved / All), scrollable chip row (mobile filter sets).
**Tokens** — active label `color.brand.primary` 600 + 2px `color.brand.primary` underline; inactive `color.text.secondary`; container bottom border `color.border.default`; segmented container `color.surface.sunken` with white active pill + `shadow.elevation.1`.
**Sizes** — 48px mobile / 40px desktop; label `font.size.label`; optional count badge in `color.surface.sunken` (`color.brand.primarySubtle` when active).
**Mobile** — horizontally scrollable with edge fade, no wrapping, active tab scrolled into view; never more than 5 tabs (use a Select for more).
**Desktop** — left-aligned; counts always shown for queues (Pending 6).
**Accessibility** — `role="tablist"`, arrow-key navigation, `aria-selected`, panel `aria-labelledby`; tab state reflected in the URL so a review queue can be shared.

---

## 11. Status chips

**Anatomy** — `[6px dot or 14px icon] label`, pill, single line, never truncated.
**Variants** — the five status families (success / warning / error / info / neutral) plus **priority** chips (High = error tokens, Medium = warning tokens, Low = neutral tokens, always with the word).
**Sizes** — sm 24px (table rows, `font.size.mono`-adjacent 12px 600), md 28px (cards, 13px 600), lg 32px (screen headers, 14px 600).
**Tokens** — bg `color.status.X.bg`, text `color.status.X.text`, dot `color.status.X.fg`, radius `radius.chip`; optional 1px `color.status.X.border` on white cards.
**Content rule** — chips carry a **specific** label: `Late 18 min`, `Outside area — needs approval`, `Approved by Suresh`. Not `Warning`.
**Mobile / Desktop** — identical; on mobile chips sit on their own line above meta text, never squeezed beside a truncated name.
**Accessibility** — text carries the meaning (never colour alone); not focusable unless it is also a filter; if a chip is a live counter, wrap in `aria-live="polite"`.

---

## 12. Avatars

**Variants** — initials (default: `color.brand.primarySubtle` bg, `color.brand.primary` 700 text), photo, icon fallback (`circle-user`), group stack (max 3 + "+4").
**Sizes** — 28 (dense table), 36 (row/card), 44 (mobile list), 56 (profile header), 88 (profile screen).
**Radius** — `radius.md` on admin surfaces (squared, data-like), `radius.avatar` (circular) on employee surfaces.
**Rule** — never overlay a status colour ring on an avatar to signal attendance; status is a chip. A small `camera`-badge overlay is allowed only on the employee's own editable profile photo.
**Accessibility** — decorative when the name is adjacent (`aria-hidden`); otherwise `alt` = full name; initials are computed from the first and last name parts and must handle single-word names.

---

## 13. Cards

**Anatomy** — optional header (title + meta + action) → body → optional footer actions. Padding `space.5`.
**Variants** — plain, sectioned (internal 1px `color.border.subtle` dividers), interactive (whole card is a link: hover `shadow.elevation.2` + `color.border.strong`), status-led (2px left border in `status.X.fg` **plus** a chip), warm (employee positive moments: `color.warm.subtle` bg, `color.warm.border`, `radius.cardEmployee`).
**Tokens** — bg `color.surface.default`; border 1px `color.border.default`; radius `radius.card` (admin) / `radius.cardEmployee` (employee); shadow `elevation.1` at rest.
**Mobile** — full-width minus `layout.screenPaddingMobile`, stacked with `layout.sectionGapMobile`; no nested cards (use dividers).
**Desktop** — grid columns of equal height; a card never exceeds `layout.readingMaxWidth` for text-heavy content.
**Accessibility** — interactive cards have one focusable element wrapping the whole card, with nested actions moved to a footer to avoid nested interactives; heading levels follow document order.

---

## 14. Tables

**Anatomy** — sticky header (`color.surface.sunken`, 12px uppercase micro-labels) → rows 52px desktop → optional sticky first column → footer with count and pagination.
**Variants** — read-only data, selectable (leading checkbox + bulk action bar), expandable rows (attendance day detail), editable-cell (payroll adjustments only, with an explicit Save and an audit note).
**Tokens** — row divider 1px `color.border.subtle`; hover `color.surface.sunken`; selected `color.brand.primarySubtle`; numerics `font.size.data` mono right-aligned; container radius `radius.card` with `overflow: hidden`.
**Column rules** — name column left and sticky; times/hours/amounts right-aligned mono; status column fixed width holding a chip; actions right-most, max three.
**Mobile (mandatory)** — below `breakpoint.md` every table becomes a **stacked row-card list** (see Employee row / Task card): name + chip on line 1, key data pairs on line 2, actions full-width at the bottom. A horizontally scrolling table is **not** an acceptable mobile fallback for attendance, leave or payroll. Sorting/filtering moves into a filter sheet.
**Tablet (md)** — table retained with sticky first column and horizontal scroll for secondary columns only; status and approval columns must remain visible without scrolling.
**Desktop** — full table, sortable headers, 25/50/100 page sizes, column visibility menu; totals row for payroll pinned to the bottom.
**Accessibility** — real `<table>` with `<th scope>`; sortable headers are buttons with `aria-sort`; row selection count announced; never convey a value only by row background colour; every row's status is text.

---

## 15. Mobile bottom navigation

**Anatomy** — 4 items max, each 24px icon + always-visible label (`font.size.caption` 600), height `layout.bottomNavHeight` + `env(safe-area-inset-bottom)`.
**Items (V1 employee)** — Home · Tasks · Attendance · Profile.
**Tokens** — bg `color.surface.default`, 1px top `color.border.default`, active `color.brand.primary`, inactive `color.text.tertiary`; active also shows a 3px top indicator bar so it is not colour-only.
**Rules** — labels are never hidden; no centre FAB; badge dots only on Tasks and Home (count ≤ 9 then "9+"); nav is hidden on full-screen flows (camera proof capture, check-in confirmation) and restored after. Items disappear entirely if their module is disabled for the tenant — the nav re-balances to 3 items rather than showing a dead tab.
**Desktop** — hidden at `breakpoint.md` and above; replaced by top bar navigation.
**Accessibility** — `<nav aria-label="Main">`, `aria-current="page"`, 48px minimum per item, reachable in one tab stop group.

---

## 16. Desktop sidebar

**Anatomy** — logo (26px symbol + wordmark) → tenant switcher (platform admins only) → module nav groups → footer (user, role label, sign out).
**Widths** — `layout.sidebarWidth` 240px expanded (`breakpoint.lg`+), `layout.sidebarWidthCollapsed` 72px icons-only (`breakpoint.md`), off-canvas drawer below `md`.
**Tokens** — bg `color.surface.default` with 1px right `color.border.default` (light, not a dark rail — keeps the admin surface airy); active item `color.brand.primarySubtle` bg + `color.brand.primary` 600 text + 3px left indicator; hover `color.surface.sunken`; group label 12px uppercase `color.text.tertiary`.
**Rules** — only **enabled modules** appear (Constitution §5: hiding is not enough, but a hidden item is still required); a module the user's role cannot access is absent, not greyed; max two levels of nesting; the active module's sub-items expand inline.
**Accessibility** — `<nav aria-label="Modules">`, `aria-current="page"`, collapsed mode shows tooltips on focus, expanded state persists per user.

---

## 17. Top bar

**Anatomy (desktop)** — breadcrumb / page title → global search → date-range or branch context → notifications (`bell` + count) → avatar menu. Height `layout.topBarHeightDesktop`.
**Anatomy (mobile)** — back or logo → screen title (truncating) → one action (notifications or more). Height `layout.topBarHeightMobile`.
**Tokens** — bg `color.surface.default`, 1px bottom `color.border.default`, no shadow at rest; on scroll adopt `shadow.elevation.1`.
**Rules** — the tenant company name is always visible on admin surfaces (multi-tenant safety); an impersonation/support session shows a persistent `color.status.warning` band reading "Support session — actions are logged" and cannot be dismissed.
**Accessibility** — `<header>` + `<h1>` per screen, notification count in the accessible name ("Notifications, 3 unread"), skip-to-content link as the first focusable element.

---

## 18. Modal

**Anatomy** — title (`font.size.h2`) → body → footer (secondary left, primary right). Width 480px default, 640px for review content. Radius `radius.modal`, `shadow.elevation.4`, overlay `color.surface.overlay`.
**Variants** — confirm, **impact confirm** (the STF signature: consequence sentence + affected-count block + optional required reason + typed confirmation for irreversible module disables), form, review (side-by-side proof and details), success (employee-facing, may use warm tokens).
**Impact confirm content order** — 1) plain consequence sentence, 2) what stops working, 3) affected employee/user count, 4) data-retention reassurance, 5) reason field where the Constitution requires it, 6) buttons with the consequence named on the primary.
**Mobile** — below `breakpoint.md` modals become full-height bottom sheets (`radius.sheet` top, drag handle, sticky footer). Impact confirms are **never** collapsed or shortened on mobile.
**Desktop** — centred, max-height 80vh with a scrolling body and pinned footer.
**Accessibility** — `role="dialog" aria-modal="true"`, labelled by the title, focus trapped, focus returns to the trigger, `Esc` closes only non-destructive modals, destructive modals require an explicit choice.

---

## 19. Drawer

**Variants** — right detail drawer (employee, task, exception, audit event — 480px desktop), left nav drawer (mobile admin), bottom sheet (mobile equivalent of both).
**Tokens** — `color.surface.raised`, `shadow.elevation.4`, motion `duration.sheet` + `easing.decelerate`.
**Rules** — a drawer never contains a second drawer; it must be deep-linkable (URL reflects the open record) so an admin can share an exception; unsaved changes prompt before closing.
**Mobile** — bottom sheet at 90% height with a drag handle; content scrolls, header and footer pinned.
**Accessibility** — same dialog semantics as Modal; the drawer's heading names the record ("Meena Joshi — 7 August exception").

---

## 20. Toast / notification

**Anatomy** — 20px status icon → message (one line, up to two) → optional single action ("Undo", "View") → dismiss.
**Tokens** — `color.surface.inverse` bg with `color.text.inverse` for neutral confirmations; status variants use `status.X.bg` + `status.X.text` + 1px `status.X.border` on light surfaces; radius `radius.md`; `shadow.elevation.3`.
**Placement** — mobile: bottom, above the bottom nav, full-width minus padding. Desktop: bottom-right stack, max 3, newest on top.
**Timing** — success 4s, info 5s, error **persistent until dismissed**. Never auto-dismiss anything the user must act on.
**Rules** — a toast never carries the only copy of important information (an approval result also updates the row and the audit log). Offline queue confirmations use `status.info` with the `cloud-off` icon.
**Accessibility** — `role="status"` (`role="alert"` for errors), `aria-live`, not focus-stealing; if it has an action it must remain until dismissed or actioned; motion `duration.base` slide+fade, opacity-only under reduced motion.

---

## 21. Alert / warning banner

**Anatomy** — 20px icon → title (`font.size.label`) → body (`font.size.secondary`) → optional inline action; 1px border + tinted bg + 3px left border in `status.X.fg`.
**Variants** — info (policy explanation), warning (dependency, late consequence, unreviewed payroll), error (failed payroll run, sync failure), success (rare, prefer toast), **consequence banner** (inside forms, states the payroll or attendance effect before submit).
**Placement** — inside the affected card or above the form it concerns. Never a page-level banner stack; one banner maximum per region.
**Mobile** — full-width, text wraps freely, action becomes a full-width button below the text.
**Accessibility** — not a live region when rendered with the page; `aria-live="assertive"` only when it appears in response to an action; the icon is decorative, the title carries meaning.

---

## 22. Empty state

**Anatomy** — illustration (geometric, ≤120px) → title (`font.size.h3`) → one or two lines of body (`color.text.secondary`, max 2 lines) → optional single primary action → optional "Learn what this means" link.
**Illustration rule** — built only from circles, rounded rectangles and the three logo bars, in `color.brand.primarySubtle` / `color.brand.primary` (admin) or `color.warm.subtle` / `color.warm.accentSoft` (employee). No characters, no scenes, no drawn people, no stock illustration.
**Variants** — first-run (encouraging, warm on employee screens), all-clear (admin: "No exceptions to review. Attendance for today is clear." — reassurance, not emptiness), no-results (search: shows the query and a Clear action), no-access (permission: explains who to ask, never a dead end), module-disabled (explains the module is off and who can enable it).
**Copy** — exactly as specified in `../01-brand/voice-and-microcopy.md` §9.
**Accessibility** — illustration `aria-hidden`; the title is a real heading; the action is a real button; never render an empty state that offers no next step or explanation.

---

## 23. Loading state

**Order of preference** — 1) optimistic result, 2) skeleton, 3) inline spinner, 4) full-page spinner (last resort, never for a whole admin screen).
**Skeletons** — mirror the final layout's boxes at `color.surface.sunken`, `radius` matching the real element, `motion.duration.skeleton` shimmer; row counts fixed (3 mobile / 6 desktop) so the page does not jump.
**Spinners** — `loader-circle`, `color.brand.primary`, appear only after 400ms; inside buttons the label is replaced by the spinner at fixed width.
**Rules** — never show a number, hour total or salary figure in a partially-loaded state; show the skeleton until the value is final. Tables load header-first, then rows. Long jobs (payroll calculation, report export) use a progress card with a plain-language step ("Calculating attendance for 55 employees…") and remain interruptible where safe.
**Accessibility** — `aria-busy="true"` on the region, `aria-live="polite"` completion announcement, skeletons `aria-hidden` with a single "Loading attendance" status node; static tint under reduced motion.

---

## 24. Error state

**Levels** — field (inline under input), form (banner at top of form listing the fields), region (card-level retry), screen (full-screen with illustration + Retry + "Go to Home"), offline (persistent bar).
**Anatomy** — what happened → why if known → what to do next → action. Never a raw code alone; a support reference ID may appear in `font.size.mono` `color.text.tertiary`.
**Tokens** — `status.error` set; screen-level uses the empty-state illustration frame with error tokens.
**Offline** — a persistent `status.info` bar with `cloud-off`: "No internet. Your check-in is saved on this phone and will be sent when you're back online." Queued items show a `Waiting to send` neutral chip. Nothing is silently lost.
**Permission error** — "You don't have access to Payroll. Ask your company owner if you need it." Never expose whether the record exists.
**Accessibility** — errors announced (`role="alert"`), focus moved to the form banner on submit failure, the failing field's label included in the message, retry is always keyboard reachable.

---

## 25. File upload

**Anatomy** — drop zone (desktop) / two buttons (mobile: `Take Photo` primary, `Choose File` secondary) → constraints line → thumbnail list with progress and remove.
**Constraints (stated up front)** — images JPG/PNG/HEIC, documents PDF; 10 MB per file; up to 5 files per task proof; client-side downscale of photos to max 2000px long edge before upload.
**States** — idle, dragover (`color.brand.primarySubtle` bg, dashed `color.border.focus`), uploading (per-file progress + Cancel), success (thumbnail + filename + size), error per file (reason + Retry, other files unaffected), offline (queued with `Waiting to send`).
**Rules** — camera capture is the default path on mobile for task proof; a captured photo shows the time and, where the feature flag requires it, the location — labelled plainly ("Photo taken at 3:14 PM near Warehouse 2"), never as a tracking readout. Documents in `My documents` are private to the employee, HR and permitted roles; the screen states who can see them.
**Accessibility** — real `<input type="file">` behind the styled control, keyboard operable, per-file progress announced politely, remove buttons labelled with the filename.

---

## 26. Attendance action card (employee, signature component)

**Anatomy** (top to bottom) — live clock (`font.size.dataXl`, mono, updates every second) → date line → **location status chip** → primary action (`Check In` / `Check Out`, full-width, `size.xl`, `shadow.primaryAction`) → shift line under the action → consequence banner when applicable → hours pair (Today / This week).
**Location states** — inside permitted area (success chip, custom geofence glyph), outside permitted area (warning chip + "You are 1.4 km outside the Shivaji Market area" + the action stays enabled and becomes "Check In — needs approval" with a required reason field), location off (info chip + "Turn on location to check in, or ask your manager to record it for you"), not required by policy (chip omitted entirely — no empty placeholder).
**Consequence rule** — if checking in now produces a late mark, the exact minutes appear **before** the tap, and the confirmation repeats what was recorded.
**Post-action** — the card flips to a **warm confirmation** (`color.warm.subtle`, `color.warm.border`, single 1→1.03→1 pulse): "Checked in at 9:42 AM · Have a good shift, Ravi." The action becomes `Check Out` with elapsed hours ticking. Warm tokens appear here and nowhere else on the screen.
**Tokens** — card `color.surface.default`, `radius.cardEmployee`, `shadow.elevation.2`; action `color.brand.primary`; confirmation warm set.
**Mobile** — the action's centre sits within the thumb zone at 360px height budget; the card never requires scrolling to reach the action.
**Desktop** — centred at 420px max width; used by office staff, same behaviour.
**Accessibility** — the button's accessible name includes the consequence ("Check In, will record 12 minutes late"); the clock is `aria-live="off"` (not announced every second) while the confirmation is `role="status"`; location status is text, never an icon alone; multiple rapid taps are debounced and the recorded time is the server time, shown back to the user.

---

## 27. Metric card

**Anatomy** — status dot + label → value (`font.size.dataLg` mono) → optional delta or sub-line → optional "View" affordance if it filters a list.
**Variants** — plain count, status count (Present/Late/Absent/On Leave — dot in `status.X.fg`, value in `color.text.primary` **not** the status colour, so the number stays readable), currency (payroll totals, `₹` + Indian grouping), ratio ("42 of 55"), interactive (filters the table below; shows a selected state with `color.brand.primarySubtle` and `aria-pressed`).
**Rules** — never colour the whole card by status; never animate the number; a metric that is still loading shows a skeleton, not `0`; percentages always accompany the absolute count.
**Mobile** — 2-up grid at 360px (two rows of two for the four attendance statuses), full-width for currency values.
**Desktop** — 4-up at `lg`, equal height, `space.4` gap.
**Accessibility** — label and value in one accessible name ("Late, 6 employees"); interactive metrics are buttons with `aria-pressed`; dot `aria-hidden`.

---

## 28. Employee row

**Anatomy (desktop table row, 52px)** — avatar 28 + name (600) + employee code (mono caption) → in → out → hours → status chip → actions.
**Anatomy (mobile card)** — line 1: avatar 44 + name + status chip; line 2: In 09:42 · Out — · 2:06 (mono pairs with labels); line 3 (conditional): exception reason; footer: full-width actions when a decision is needed.
**Variants** — read-only, reviewable (Approve / Review), selectable (payroll), with-exception (2px left border `status.warning.fg` + reason line), on-leave (info chip + leave type).
**Rules** — the status chip is never truncated and never replaced by a dot on mobile; the name wraps rather than truncating in approval contexts; sensitive fields (salary, bank, documents) never appear in a row unless the viewer's permission allows it — and then behind an explicit action, not inline.
**Accessibility** — one row = one `<tr>` with the name as `<th scope="row">`; mobile cards are list items with a heading; actions labelled with the person's name ("Approve Meena Joshi's exception").

---

## 29. Task card

**Anatomy** — priority chip + status chip → title (`font.size.h3`, up to 2 lines) → assignee avatar + name → due date (mono, with `Overdue` error chip when past) → optional time frame → proof requirement indicator (`paperclip` + "Photo proof required") → footer action.
**Variants** — employee "my task" (action: `Start` / `Submit Proof`), manager list item (action: `Review`), completed (muted, proof thumbnail visible), overdue (error left border + `Overdue` chip), recurring (`refresh-cw` + "Repeats daily").
**Rules** — priority is a word plus colour, never colour alone; due today is emphasised in `status.warning` only when a time frame is set and near; a task requiring proof cannot show a `Completed` chip until proof exists and, where configured, has been reviewed.
**Mobile** — full-width card, one action; tapping the card opens details, tapping the action performs it (separate hit areas, both ≥48px).
**Desktop** — grid or list; assignee and due date become columns in the admin task table.
**Accessibility** — card is a link to details, action is a nested button in the footer (not overlapping), chips are text, proof requirement stated in text not just an icon.

---

## 30. Approval card

The governance workhorse — used for attendance exceptions, leave requests, task proof review and payroll adjustments.

**Anatomy** — requester (avatar + name + role/branch) → **request statement** in one plain sentence ("Checked in 1.4 km outside the Shivaji Market area at 9:12 AM") → supporting evidence (reason text, photo thumbnail, distance, timestamps in mono) → **impact line** ("Approving marks this Present. No payroll change." / "2 unpaid days will be applied to August payroll.") → decision actions (`Approve` primary, `Reject` danger-subtle, `Ask for details` outline) → after decision: an audit line ("Approved by Suresh Nair · 7 Aug, 10:04 AM · reason: on delivery run").
**Rules (Constitution §3)** — no silent approvals; Reject **always** requires a reason; the impact line is mandatory and must be computed, not generic; the audit line persists on the card after the decision and links to the audit log; bulk approval is permitted only for identical exception types and shows the combined count and impact before applying.
**Tokens** — `color.surface.default`, `radius.card`, 2px left border in the relevant `status.X.fg`; evidence block on `color.surface.sunken`; impact line uses `status.warning` when money or attendance changes, `status.neutral` when nothing changes.
**Mobile** — actions stack full-width in the order Approve, Reject, Ask for details; evidence photo opens full-screen; the impact line is never collapsed behind "more".
**Desktop** — 640px card or side drawer; keyboard shortcuts `A` approve / `R` reject are allowed only with a confirmation step.
**Accessibility** — the card is a `<section>` labelled with the requester and request type; actions name the person and outcome; reason field is a labelled required textarea; the decision result is announced and focus moves to the next pending item.
