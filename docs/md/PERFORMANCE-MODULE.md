# Sudarshan Task Force — Performance & Leaderboards

Version: 1.0  |  Date: 18 August 2026  |  Status: **Approved** (owner, 18 Aug 2026)

The last unbuilt main V1 module. MODULES.md defines it in one binding
sentence: *"attendance and task-derived indicators only, with transparent
definitions"*, and adds *"Leaderboards require their source module and a
published scoring definition."* This document turns that sentence into a
buildable, phased feature list — with the gamification layer the owner
asked for: rewards, streaks, badges, a game-styled leaderboard, and daily
motivation, built to look and feel alive.

---

## 1. Principles (the rules everything below obeys)

1. **Points come only from attendance and task evidence.** No manual
   score fiddling, no opinion-based ratings. (Amendment 2, approved with
   this document, adds three narrow evidence-based sources: planned
   leave, onboarding completion, work anniversary — still zero opinion.)
2. **The scoring definition is published before points count.** Every
   employee can open "How points work" and see the exact rules. The
   definition is stored as a versioned tenant policy — the same machinery
   payroll and attendance rules already use — so a change never
   retroactively rewrites anyone's history, and every point row carries
   the policy version that produced it.
3. **Every rule is individually customizable.** Each earning rule is its
   own switch with its own value: ON/OFF per rule, points per rule,
   thresholds per rule (early-bird minutes, daily cap, week length).
   Companies differ; the module bends, the principles don't.
4. **Rewards, never fines.** Absence and lateness already have real
   consequences in payroll. Points only go up; a bad day earns nothing.
5. **Points are never money inside STF.** Rewards record fulfilment;
   cash goes through the existing audited payroll adjustment. This keeps
   the module outside statutory payroll territory (D-P3-01, D-019).
6. **Only verified events score.** A check-in pending review scores when
   approved. Task proof scores when accepted. Disputed things never
   score while disputed.
7. **The bottom of the table is never a wall of shame.** Below the top
   ranks a person sees their own position and the gap to climb. Most
   Improved gets equal billing with first place.
8. **Approved leave pauses a streak, never breaks it.**
9. **Every screen follows the design system.** Warm employee surface,
   status as text plus colour, `motion-safe` animation only, no animating
   money figures (D-017), sound off by default, inline SVG on STF tokens
   — no third-party chart or gamification libraries.

---

## 2. The feature list

### A. Scoring engine — the foundation

Every award is an append-only ledger row: what happened, which attendance
record or task produced it, how many points, which scoring version.
Duplicates are impossible by construction (one award per source event, one
aggregate per period). Corrections create visible adjusting entries —
never silent rewrites (Constitution §3).

**Earning rules — each individually ON/OFF with an editable value:**

| # | Rule (per-event, Phase 1) | Default |
|---|---|---|
| 1 | On-time check-in | +10 |
| 2 | Full day recorded (in + out) | +5 |
| 3 | Early bird — checked in ≥ *15* min before shift (minutes editable) | +5 |
| 4 | Task completed | +10 |
| 5 | Task completed on/before due | +5 more |
| 6 | Task completed ≥ *24* h early (hours editable) | +5 more |
| 7 | High-priority task completed | +5 more |
| 8 | Required proof accepted | +5 |
| 9 | First-time-right — proof accepted without details requested | +5 more |
| 10 | First task of the day done before noon | +2 |
| 11 | Perfect week — on time on ≥ *6* days of one week (days editable) | +25 |
| 12 | Streak milestones — 7 / 30 / 100 consecutive on-time days | +20 / +100 / +500 |
| 13 | Comeback — first fresh *5*-day run after a broken streak | +15 |

| # | Rule (aggregate, Phase 2 — awarded by the event that completes them) | Default |
|---|---|---|
| 14 | Perfect month — every scheduled day on time | +100 |
| 15 | Clean month — no exceptions needing review | +50 |
| 16 | Monthly task volume 10 / 25 / 50 | +20 / +50 / +100 |
| 17 | Team day — whole department on time the same day | +5 each |

| # | Rule (Amendment 2 sources, Phase 2) | Default |
|---|---|---|
| 18 | Planned leave — requested ≥ *3* days ahead and approved | +10 |
| 19 | Onboarding complete — documents + profile (one-time) | +25 |
| 20 | Work anniversary — per completed year | +50 |

**Guardrails (also editable):** daily task-points cap (default 50 — the
transparent anti-farming rule) · only the day's first punch can score
"on time" · pending-review check-ins score on approval, not before.

**"How points work" screen:** the published rules in plain words, only
the enabled ones, with the version and since-when.

### B. Daily motivation — what an employee sees every day

- **Home widget:** streak flame with count, today's points, level ring —
  the first thing seen after check-in.
- **My Performance screen:** points total with animated level-progress
  ring · streak flame · this-week bar chart · personal bests (best day,
  best week, longest streak) · badge wall — locked badges greyed with
  exactly how to earn them.
- **Streaks:** consecutive scheduled days on time; approved leave pauses,
  never breaks; milestones at 7 / 30 / 100.
- **Levels:** lifetime points climb Bronze → Silver → Gold → Platinum →
  Diamond (names tenant-editable). Levels never reset.
- **Badges (auto-earned, evidence only):** First Steps · streaks 7/30/100
  · tasks 10/50/250 · Perfect Month · Early Bird ×20 · Proof Master ×25 ·
  Comeback (most improved of a season).
- **Celebrations:** badge unlock and level-up get a full-screen moment
  with confetti on next open, honouring `prefers-reduced-motion`.
  Arrivals animate; numbers don't.
- **Bell notifications** for badge / level / streak milestones. Never an
  action tile — nothing here needs a decision.

### C. Leaderboard *(existing `PERFORMANCE.leaderboard` flag, default off)*

- **Monthly seasons**, history kept and browsable.
- **Podium** — top 3 with gold/silver/bronze on a game-styled stage.
- **Your neighbourhood** — ranks just above and below yourself plus the
  gap: "120 points to #7" is a goal; a raw rank is a shrug.
- **Most Improved** — first-class card beside the podium: biggest climb
  vs their own previous season.
- **Department boards** — average per member, so small teams can win.
- **Weekly sprint view** — the same board cut to this week.
- **Double-points days** — admin declares a date range (festival rush,
  stock-taking); all points ×2; announced on the Home widget.
- **Weekly quests** — rotating goals ("5 on-time days", "8 tasks this
  week") with bonus pots and progress bars.
- **Fair visibility** — others' points and badges visible; others'
  attendance details never.
- **Publish gate** — the flag refuses to enable until a scoring
  definition is published. Enforced in code, not memory.

### D. Rewards *(new `PERFORMANCE.rewards` flag, default off)*

- **Admin-defined reward store:** name, description, point cost, optional
  stock. A paid day off, a dinner voucher, first pick of shifts —
  whatever fits the business. Fully ON/OFF and editable per reward.
- **Redemption:** spends points visibly and raises an **action tile**
  (the existing approve/reject/snooze system) for the admin and
  department head.
- **Fulfilment:** approve = handed over; reject = points returned
  automatically with the reason shown word for word. All audited.
- **History** for both sides.

### E. Admin

- **Scoring editor:** every rule with its switch, value and thresholds ·
  preview what yesterday would have scored · **publish** a new version
  (the deliberate act the leaderboard gate checks).
- **Team overview:** points trends, top performers, most improved,
  streak health — the HR pulse view.
- **Reward management:** create/retire rewards, pending redemptions.

### F. Later, separate approval

Manager kudos (capped, anti-favouritism design needed) · shareable
achievement cards (PNG via the `next/og` machinery the app icons use) ·
announcements tie-in.

---

## 3. What this deliberately will not do

- No points from opinions or manual entries. No point deductions, no
  naming the worst performer.
- No points-to-cash conversion inside STF; no statutory entanglement.
- No continuous tracking; scoring uses exactly the events STF already
  records.
- No third-party gamification/chart libraries.

---

## 4. Technical shape (summary)

- **Data:** `performance_events` (append-only, source refs + policy
  version, uniqueness per source/period) · `employee_badges` · `rewards`
  · `reward_redemptions`. Badge and level definitions live in code like
  the feature catalog; all rule switches/values live in the versioned
  `performance` tenant policy.
- **Awarding:** inside existing server actions at the moment an event
  becomes final — the notifications pattern; no job runner.
- **Pure logic first:** scoring, streaks, levels, badges, season maths
  as pure tested modules (pattern: `nav.ts`, `payroll/simple.ts`).
- **Flags:** module `PERFORMANCE` (exists, requires Attendance or Tasks),
  feature `leaderboard` (exists), new `rewards`.
- **Charts & animation:** inline SVG rings/bars on tokens; CSS keyframes
  under `motion-safe`; lightweight local confetti.

---

## 5. Build phases

| Phase | Contains |
|---|---|
| **P1 — Scoring foundation** | Ledger + migration · pure engine + tests · versioned policy with per-rule switches · admin editor with publish · awards wired into check-in / check-out / review-approval / task actions · employee points view + "How points work" |
| **P2 — Daily motivation** | Streaks · levels · badges + celebrations · My Performance · Home widget · bell notices · aggregate awards (14–17) · Amendment-2 sources (18–20) + MODULES.md Amendment 2 text |
| **P3 — Leaderboard + mechanics** | Seasons · podium · neighbourhood · Most Improved · department + weekly views · publish gate · admin overview · double-points days · weekly quests |
| **P4 — Rewards** | Store · redemption via action tiles · fulfilment + history · audit |
| **P5 — Extras** | Kudos, share cards — separately approved |

Each phase ships independently: tests, typecheck, build, browser
verification at 360px and desktop, migration applied, commit, deploy.

---

## Give this to Claude

Build phases in order. The scoring definition is a versioned tenant
policy where EVERY rule is individually enable-able and editable; every
point row stamps its version. The leaderboard flag must refuse to enable
until a definition is published. Points only accrue after first publish.
Rewards never touch payroll amounts. All indicator maths is pure and
unit-tested before any screen renders it.
