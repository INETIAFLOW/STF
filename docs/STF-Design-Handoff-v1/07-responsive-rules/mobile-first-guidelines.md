# STF Mobile-First Guidelines — v1.0

The employee product **is** the mobile product. Desktop enhances administration; it does not define STF (Product Constitution §4).

## 1. Design order
1. Draw the 360px screen first, with real content: the longest employee name, a two-line task title, a 12-minute late warning.
2. Identify the **one** primary action. If there are two, one of them is wrong.
3. Place it in the thumb zone — within `layout.thumbZoneBottom` (160px) of the bottom edge, above the bottom nav.
4. Only then consider tablet and desktop.

## 2. Hard rules
- **Touch targets** ≥ 48×48px, ≥ 8px apart. Primary mobile action 56px tall, full width.
- **Type** 16px body minimum (also prevents iOS input zoom), 14px secondary, 13px absolute floor.
- **One primary action per screen.** Secondary actions are outline or subtle; tertiary actions live in a "more" sheet.
- **No horizontal scrolling** except deliberate chip/tab rows with a visible edge fade.
- **No hover-only affordances.** Everything is reachable by tap.
- **Bottom navigation** for employees: Home · Tasks · Attendance · Profile. Labels always visible. Hidden only during full-screen flows (camera capture, confirmation), then restored.
- **Status is text + colour** at every size. A chip never degrades to a dot on mobile.
- **Consequence before action**, always visible without scrolling or expanding.

## 3. Screen budget at 360×640 (small phone, no scroll)
The check-in screen must fit its clock, date, location chip, consequence banner and primary action **without scrolling**. If a new element is proposed for this screen, something else must leave. Everything below (hours, pending items, privacy note) may scroll.

## 4. Input
- `inputmode="numeric"` for phone, OTP and amounts; `tel` keyboard for phone.
- Labels above fields; placeholders are examples, never labels.
- One field per row. No side-by-side inputs below `md` except from/to dates.
- OTP allows paste. No captcha or puzzle (WCAG 2.2 Accessible Authentication).
- Camera is the default path for task proof; a file picker is always available as a fallback.

## 5. Performance and network reality
Assume a ₹8,000 Android phone on a patchy 4G connection in a warehouse.
- First meaningful paint before data: shell, nav and headings render immediately; data fills in via skeletons.
- Photos downscaled client-side to a 2000px long edge before upload.
- Offline-first for check-in, check-out, task proof and leave requests: queue locally, confirm locally, sync later, never lose.
- Lists paginate at 20 items with an explicit "Load more"; no infinite scroll in records the user may need to find again.
- Fonts self-hosted and subset; the UI must be readable and usable before webfonts load (fallback stack is metric-tolerant).

## 6. Employee-surface warmth (the Sahay allowance)
- Canvas `color.surface.canvasWarm`, cards `radius.cardEmployee` 16px.
- Exactly **one** warm element per screen, only for: check-in/out success, welcome, recognition, supportive empty states.
- Microcopy is human and specific: "Have a good shift, Ravi." — never jokey, never patronising, never guilt-framed.
- Warmth never replaces clarity: the warm confirmation still states the exact recorded time and any late minutes.

## 7. Employee screen checklist
- [ ] Completes at 360px without horizontal scroll; nothing breaks at 320px
- [ ] Exactly one primary action, in the thumb zone, ≥56px
- [ ] Every status carries a word
- [ ] Any consequence (late, unpaid days, proof requirement) is visible before the action
- [ ] Empty, loading, error and offline states defined with the approved copy
- [ ] Works with location off and with no connection
- [ ] At most one warm element
- [ ] Any data captured about the person is explained on the screen that captures it
