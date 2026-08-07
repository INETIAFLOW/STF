# STF Brand Guidelines — v1.0 (Approved)

Product: **Sudarshan Task Force** · Short name: **STF**
Descriptor / tagline: **Workforce • Tasks • Attendance • Payroll**
Approved direction: **Disha (Modern Fintech-Clean)** with restricted **Sahay** warmth.
Date: 07 August 2026 · Source of truth: STF Pack 01 + this handoff.

## 1. Brand idea
Clear direction and disciplined follow-through. STF turns everyday work into reliable evidence: who worked, where, what was assigned, what was completed, and what salary is due.

## 2. The one-line system rule
> **Modern fintech precision for owners and admins, with a supportive and respectful experience for employees.**

Everything in this package resolves against that sentence. When a design decision is ambiguous, ask: *is this an owner/admin surface (precision) or an employee surface (support)?*

## 3. Personality
Practical · dependable · calm · disciplined · accountable · respectful.

**We are not:** aggressive, military, surveillance-flavoured, playful, or corporate-HR bland.

## 4. Dual-surface model (non-negotiable)

| | Admin / Owner surfaces | Employee surfaces |
|---|---|---|
| Purpose | Review, decide, configure, pay | Act, know, request, submit |
| Feeling | Precise, data-clear, calm authority | Supportive, generous, fast |
| Background | `color.surface.canvas` #F7F8FC (cool) | `color.surface.canvasWarm` #FAF8F5 (warm off-white) |
| Card radius | `radius.card` 12px | `radius.cardEmployee` 16px |
| Density | Dense but readable; tables allowed | Generous; one primary action per screen |
| Warm accent | **Not used** | Positive human moments only |
| Type scale | Desktop scale, 13px floor | Mobile scale, 14px floor |

Screens covered by "admin precision, no warmth": payroll (all screens), reports, audit/activity log, module management, feature toggles, role & permission management, tenant settings, attendance policy and shift settings.

## 5. Warm accent policy (Sahay, restricted)
Warm terracotta `color.warm.accent` #A2451F is a **moment colour, never a brand colour**.

Permitted uses — employee-facing only:
- Check-in / check-out success confirmation
- Welcome and first-run states
- Recognition and streak-style positive acknowledgement (attendance/task derived only, with transparent definitions)
- Helpful prompts and supportive empty states
- Employee-side illustration accents

Forbidden uses:
- Primary buttons, navigation, links, focus rings
- Any admin, payroll, report, audit, or configuration surface
- Status colours (success/warning/error/info are fixed and separate)
- More than **one** warm element visible per employee screen

## 6. Colour, type, spacing
Authoritative values live in `02-design-tokens/`. Never hard-code a hex that is not in `colors.json`.

## 7. Voice
See `voice-and-microcopy.md`. Short active sentences. State the consequence **before** the action. Errors say what happened and what to do next.

## 8. Photography & illustration
Authentic Indian SME work contexts — counters, warehouses, dispatch bays, delivery, workshops, field visits. People shown with dignity, at work, not posed as "resources". Illustration is limited to empty, loading, onboarding and success states, drawn from simple geometric shapes in brand colours (see `04-components/component-specifications.md` → Empty state).

**Do not** use stock "corporate handshake" imagery, surveillance visuals (CCTV, maps with tracked dots, watchtowers), or crowd-shot HR clichés.

## 9. Accessibility floor
WCAG 2.2 AA. Body text ≥ 14px mobile / 13px desktop dense tables. Touch targets ≥ 48×48px on employee screens, ≥ 40×40px on admin desktop. Status is **always text + colour**, never colour alone. See `04-components/accessibility.md`.

## 10. Change control
Any change to tokens, logo, component patterns, or the dual-surface model updates this file and `08-claude-code-handoff/design-decisions.md` first. Code follows the approved document.
