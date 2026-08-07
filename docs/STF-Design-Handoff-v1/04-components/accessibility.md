# STF Accessibility Standard — v1.0

Target: **WCAG 2.2 Level AA**, verified on a 360px Android phone and a 1440px desktop. Accessibility here is also a product-integrity requirement: STF records evidence that affects people's pay, so no status may be ambiguous.

## 1. Non-negotiables
1. **Status is text + colour, never colour alone.** Every attendance, leave, task, payroll and module state carries a word. A red row, a green dot or an amber background is never the only signal.
2. **Consequence before action.** Any control that changes attendance, leave, pay or configuration states its effect in text before activation, and the effect is part of the control's accessible name.
3. **Touch targets:** 48×48px minimum on employee surfaces, 40×40px on admin desktop, with 8px minimum separation between adjacent targets.
4. **Text minimums:** 16px body on employee mobile, 14px secondary, 13px absolute floor; 15px/13px/12px on admin desktop. Status text never below 12px.
5. **Focus is always visible:** 2px `color.border.focus` outline + `shadow.focusRing`, 2px offset, on every interactive element including cards, rows and chips. Focus is never suppressed for aesthetics.
6. **Nothing critical is mobile-hidden.** Approval state, exception reasons, payroll impact and audit information appear at 360px. Progressive disclosure is allowed; omission is not.

## 2. Contrast
All token pairings are pre-verified in `../01-brand/color-palette.md`. Requirements: 4.5:1 body text, 3:1 text ≥24px or ≥19px bold, 3:1 for UI boundaries and focus indicators, 3:1 for meaningful graphics (status dots, chart series).
`color.text.tertiary` (4.6:1) is limited to labels ≥13px. `color.text.disabled` is for disabled controls only and never carries information.
Test in both themes and under Windows High Contrast / forced-colors: borders and focus rings must survive because they are real outlines, not shadows alone.

## 3. Semantics & structure
- One `<h1>` per screen naming the screen; heading levels never skip.
- Landmarks: `<header>`, `<nav aria-label>`, `<main>`, `<aside>`, `<footer>`. Skip-to-content is the first focusable element.
- Real elements: `<button>`, `<a href>`, `<table>`, `<input>`, `<fieldset><legend>`. No `div` with a click handler.
- Tables use `<th scope>`; the employee name is the row header; sortable headers are buttons with `aria-sort`.
- Lists of records are `<ul>/<li>` on mobile with a heading per item.

## 4. Keyboard
- Logical DOM order = visual order; no positive `tabindex`.
- Dialogs and drawers trap focus, close on `Esc` (non-destructive only), and return focus to the trigger.
- Menus, listboxes, tabs and calendar grids follow ARIA APG keyboard patterns.
- Admin power paths (approve/reject queues, payroll review) are fully completable by keyboard, including reason entry.
- No keyboard trap in the camera/proof capture flow: a file-input fallback is always focusable.

## 5. Screen readers
- Every icon-only control has an `aria-label` matching its tooltip.
- Live regions: `role="status"` for confirmations and counts, `role="alert"` for errors, `aria-busy` for loading regions. The check-in clock is **not** a live region.
- Approval outcomes announce the person and the result ("Approved. Meena Joshi's attendance updated to Present.").
- Dynamic counts (pending exceptions) announce politely, not on every keystroke.
- Form errors: on submit, focus moves to a summary banner listing each failing field as a link.

## 6. Forms
- Visible `<label>` for every field; placeholders are examples only.
- "Required" written as a word; optional fields marked "Optional" where a form mixes both.
- Errors identify the field, say what happened and what to do next, and persist until fixed.
- Autofill/autocomplete attributes on name, phone, OTP.
- No timeout that loses entered data; if a session must expire, work is preserved and re-authentication returns the user to the same state (WCAG 2.2 §3.3.7 Redundant entry, §2.2.1).
- WCAG 2.2 specifics honoured: **Focus Not Obscured** (sticky bars never cover the focused element — scroll padding accounts for the bottom nav and sticky action bar), **Dragging Movements** (any drag has a tap alternative), **Target Size (Minimum)**, **Consistent Help** (support contact in the same place on every screen), **Accessible Authentication** (OTP paste allowed, no puzzle).

## 7. Motion & timing
- `prefers-reduced-motion` respected system-wide (see `component-states.md` §3).
- Nothing auto-advances, auto-plays or auto-refreshes under the user; a "New data available — Refresh" chip is used instead.
- Toast timings: success 4s, info 5s, errors persistent. Timers pause on hover/focus.

## 8. Language & readability
- English UI, plain vocabulary, short sentences — written for a non-technical warehouse or delivery employee, not an HR professional.
- `lang="en"` on the document; layouts tolerate a 30% label-length increase for future language packs.
- Numbers, times and currency in Indian conventions (₹1,42,800; 24-hour or AM/PM consistently per screen; dates as `7 Aug 2026`).
- Abbreviations expanded on first use; no internal jargon ("geofence" never reaches an employee screen — see the vocabulary table in `../01-brand/voice-and-microcopy.md`).

## 9. Privacy as accessibility (Constitution §7)
- Every screen that captures location, a selfie or a document states **why**, in text, at the point of capture.
- Sensitive data (salary, bank, documents, location history) is behind explicit permissions and an explicit action — never rendered inline "just in case".
- An impersonation/support session shows a persistent, non-dismissible warning band.
- Employees can see what was recorded about them on their own screens, in the same words the admin sees.

## 10. Testing checklist (per screen, before hand-off to build)
- [ ] Keyboard-only completion of the screen's primary task
- [ ] NVDA/TalkBack pass: headings, labels, status announcements, live regions
- [ ] 360px and 1440px layouts; 200% browser zoom with no loss of content or function
- [ ] 320px reflow with no horizontal scrolling (WCAG 1.4.10)
- [ ] Contrast audit of all text, borders, focus rings and status graphics
- [ ] Colour-blindness simulation (deuteranopia + achromatopsia): every status still readable
- [ ] Reduced-motion pass
- [ ] forced-colors / High Contrast pass
- [ ] Offline and error states reachable and understandable
- [ ] Every disabled control has a stated reason
