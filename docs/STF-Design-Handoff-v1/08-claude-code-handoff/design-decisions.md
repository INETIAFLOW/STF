# STF Design Decisions — v1.0

Each entry: the decision, why, what was rejected, and what would reopen it. This is the change log for the design system (Product Constitution §8).

---

**D-001 · Disha (Modern Fintech-Clean) is the base direction**
Three directions were explored: Sahay (warm/human), Dhruv (utilitarian/industrial), Disha (fintech-clean). Disha was selected because it follows the Brand Guidelines' suggested indigo foundation, carries authority where trust matters most (payroll, module management, audit), stays calm and non-surveillance-like on the employee side, and has the widest headroom as modules grow.
*Rejected:* Sahay as the base (reads soft in payroll contexts); Dhruv as the base (uppercase + amber reads stern, close to "industrial HR").
*Reopens if:* the first pilot shows owners find the product cold, or employee adoption stalls for reasons traced to visual tone.

**D-002 · Sahay warmth is restricted to employee positive moments**
Warmer canvas, softer card corners, human microcopy, and **one** terracotta element per employee screen — limited to check-in/out success, welcome, recognition and supportive empty states.
*Rejected:* a fully warm employee product (would fracture the system into two brands); warmth anywhere in admin (undermines the precision the money surfaces need).
*Reopens if:* research shows employees miss the warmth in other moments — expand the list explicitly, never by drift.

**D-003 · Two canvases and two card radii, driven by a layout attribute**
`data-surface="employee"` (#FAF8F5, 16px) vs `"admin"` (#F7F8FC, 12px). Implemented at the layout level so components stay single-variant.
*Rejected:* per-component `warm` props (guarantees inconsistency); one shared canvas (loses the felt difference between the two audiences).

**D-004 · Terracotta `#A2451F` is a moment colour, never a brand colour**
Darkened from Sahay's `#8C3B22`-family to a value that carries white text at 6.4:1 while staying visibly warm. Never primary, never a status, never in admin.
*Rejected:* using terracotta as a secondary brand accent — it would compete with the indigo and creep into admin surfaces within one sprint.

**D-005 · Status colours are a four-part set, and status is always text + colour**
Each status ships `.fg`, `.bg`, `.text`, `.border`; status is modelled as `{key, label, tone}` so a colour-only render is structurally impossible.
*Why:* STF records evidence affecting pay. An ambiguous status is a business risk, not only an accessibility issue.

**D-006 · No numeric colour ramp**
Tokens are semantic only (`color.status.success`, not `color.green500`). Prevents "pick any blue" drift and forces missing needs to surface as a token request.
*Rejected:* a 50–900 palette per hue.

**D-007 · Three typefaces: Schibsted Grotesk, Wix Madefor Text, Spline Sans Mono**
Crisp technical headlines, a screen-optimised body face with open apertures for non-technical readers on low-cost Android displays, and a monospace so times, hours and salary figures hold strict columns. All SIL OFL, safe for product, marketing and payslip PDFs.
*Rejected:* Inter (ubiquitous, no distinctiveness); a single-family system (numeric columns drift); any font requiring a commercial licence for PDF embedding.

**D-008 · Self-host fonts; do not use the Google CDN**
Offline-first mobile use, predictable payslip PDF rendering, no third-party request per load. Preload exactly two faces.

**D-009 · Lucide as the only icon library; no bespoke set**
Geometric, open, 24px grid, ISC licence, actively maintained. Three custom SVGs permitted: brand marks, the geofence status glyph (every library alternative reads as a surveillance pin), and geometric empty-state art.
*Rejected:* a commissioned icon set (cost and maintenance with no benefit at this stage); mixing two libraries.

**D-010 · The logo is three stepping bars**
Work moving through its states — assigned → in progress → done — reading as forward direction and as an abstract "S". Three solid shapes survive 16px and one-colour print.
*Rejected, per the brief and Brand Guidelines:* weapons, shields, badges, CCTV/eye/radar/fingerprint motifs, religious or political imagery, generic HR figures, and a literal chakra/disc reading of "Sudarshan".

**D-011 · "Consequence before action" is a data contract, not a copywriting habit**
Every attendance/leave/pay/configuration action must be supplied a computed consequence object; the UI renders it and appends it to the control's accessible name. If it cannot be computed, the action is not ready to ship.
*Why:* Product Bible — "All sensitive actions must show their effect before confirmation."

**D-012 · The Approval card is a single reusable contract**
Attendance exceptions, leave, task proof and payroll adjustments all use: requester → one-sentence statement → evidence → computed impact → decisions (Reject always needs a reason) → persistent audit line.
*Why:* Constitution §3 — no silent approvals. One pattern means one place to keep that promise.

**D-013 · Governed switches never flip optimistically**
Module and feature toggles show a spinner in place of the knob until the server confirms, and revert with a plain reason on failure. State is always shown as a word.
*Why:* Constitution §5 — a switch that appears on while the server says off is a lie about entitlement.

**D-014 · Every data table has a stacked-card mobile alternative**
A horizontally scrolling table is explicitly not acceptable for attendance, leave, tasks or payroll on mobile.
*Why:* managers approve from phones; squeezed tables hide exactly the approval and status columns that matter.

**D-015 · Bottom navigation is exactly four items with permanent labels**
Home · Tasks · Attendance · Profile. No centre FAB. Disabled modules remove their item and the bar re-balances.
*Rejected:* five items plus a FAB (thumb-zone crowding, and the FAB has no single obvious action for an employee).

**D-016 · Location is presented as an event, never as tracking**
Captured only at check-in and check-out. The employee sees exactly what the manager will see. "Geofence" never appears in employee-facing copy; "permitted area" is used instead. No maps with dots, no live location UI.
*Why:* Vision — "Employee dignity over surveillance theatre"; Constitution §7.

**D-017 · No celebratory motion; no counting numbers**
The check-in confirmation is a single 1→1.03→1 pulse. Payroll and attendance figures appear at final value.
*Why:* a system of record must not feel like a game, and an animating salary figure invites doubt about the final number.

**D-018 · Marketing makes its trust argument with the product, not with badges**
No customer logos or names, no adoption or accuracy statistics, no uptime or compliance claims, no prices. Permitted positioning: "Designed for Indian SMEs". Pricing page ships as a placeholder with `₹ —`.
*Reopens when:* real pilot outcomes exist and are approved for publication, and pricing is set.

**D-019 · Payroll never asserts compliance**
Approval requires an explicit acknowledgement that figures were checked with the customer's accountant. Wording is "payroll inputs you can review before you pay".
*Why:* Product Bible boundaries — statutory calculations must be configured and reviewed by a qualified local professional.

**D-020 · English-only UI in V1, with layouts built for 30% label growth**
Additional languages are backlog, but no layout may assume English string lengths.

---

## How to add a decision
Append an entry with the same shape, update the affected documents in the same change, and note it in the project's `DECISIONS.md` per Pack 01. Code follows the approved document, never the other way round.
