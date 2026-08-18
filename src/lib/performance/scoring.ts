/**
 * Performance scoring — pure logic, no I/O (PERFORMANCE-MODULE.md).
 *
 * The whole module rests on four promises this file keeps by construction:
 *
 * 1. Points derive only from attendance and task evidence — every award
 *    function here takes recorded facts, never opinions.
 * 2. Every rule is individually customizable: its own on/off switch, its
 *    own points, its own thresholds. Companies differ; the module bends.
 * 3. Rewards, never fines — nothing in this file can return negative
 *    points. A bad day earns nothing; it never costs.
 * 4. Transparent by default — each award carries the plain-words line the
 *    ledger will show, written at award time so it cannot drift.
 */

// ------------------------------------------------------------------- rules

export const RULE_KEYS = [
  "on_time",
  "full_day",
  "early_bird",
  "task_completed",
  "task_on_time",
  "task_early",
  "task_priority",
  "proof_accepted",
  "proof_first_time",
  "first_task_before_noon",
  "perfect_week",
  "streak_7",
  "streak_30",
  "streak_100",
  "comeback",
] as const;

export type RuleKey = (typeof RULE_KEYS)[number];

export interface ScoringRule {
  enabled: boolean;
  points: number;
}

export interface ScoringPolicy {
  rules: Record<RuleKey, ScoringRule>;
  /** Check-in this many minutes before shift start = early bird. */
  earlyBirdMinutes: number;
  /** Task completed this many hours before due = task_early. */
  taskEarlyHours: number;
  /** On-time days within one week that make it a perfect week. */
  perfectWeekDays: number;
  /** Consecutive on-time days that count as a comeback run. */
  comebackRunLength: number;
  /** Most task-derived points one person can earn per day (anti-farming). */
  dailyTaskCap: number;
}

export const DEFAULT_SCORING: ScoringPolicy = {
  rules: {
    on_time: { enabled: true, points: 10 },
    full_day: { enabled: true, points: 5 },
    early_bird: { enabled: true, points: 5 },
    task_completed: { enabled: true, points: 10 },
    task_on_time: { enabled: true, points: 5 },
    task_early: { enabled: true, points: 5 },
    task_priority: { enabled: true, points: 5 },
    proof_accepted: { enabled: true, points: 5 },
    proof_first_time: { enabled: true, points: 5 },
    first_task_before_noon: { enabled: true, points: 2 },
    perfect_week: { enabled: true, points: 25 },
    streak_7: { enabled: true, points: 20 },
    streak_30: { enabled: true, points: 100 },
    streak_100: { enabled: true, points: 500 },
    comeback: { enabled: true, points: 15 },
  },
  earlyBirdMinutes: 15,
  taskEarlyHours: 24,
  perfectWeekDays: 6,
  comebackRunLength: 5,
  dailyTaskCap: 50,
};

/** Ledger copy per rule — written once here so screens cannot drift. */
export const RULE_LABELS: Record<RuleKey, string> = {
  on_time: "On-time check-in",
  full_day: "Full day recorded",
  early_bird: "Early bird check-in",
  task_completed: "Task completed",
  task_on_time: "Task done on time",
  task_early: "Task done well ahead",
  task_priority: "High-priority task",
  proof_accepted: "Proof accepted",
  proof_first_time: "Proof accepted first time",
  first_task_before_noon: "First task before noon",
  perfect_week: "Perfect week",
  streak_7: "7-day streak",
  streak_30: "30-day streak",
  streak_100: "100-day streak",
  comeback: "Comeback — back on track",
};

/**
 * Untrusted input → a policy the maths can live with. Unknown rules are
 * dropped, missing ones get defaults, points are clamped to 0–10,000
 * whole points (negative points are fines, and fines are banned).
 */
export function normalizeScoring(raw: unknown): ScoringPolicy {
  const input = (raw ?? {}) as Partial<ScoringPolicy> & {
    rules?: Partial<Record<string, Partial<ScoringRule>>>;
  };

  const clampPoints = (value: unknown, fallback: number): number => {
    const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
    return Math.min(10_000, Math.max(0, n));
  };
  const clampInt = (value: unknown, fallback: number, min: number, max: number): number => {
    const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
    return Math.min(max, Math.max(min, n));
  };

  const rules = {} as Record<RuleKey, ScoringRule>;
  for (const key of RULE_KEYS) {
    const fallback = DEFAULT_SCORING.rules[key];
    const given = input.rules?.[key];
    rules[key] = {
      enabled: typeof given?.enabled === "boolean" ? given.enabled : fallback.enabled,
      points: clampPoints(given?.points, fallback.points),
    };
  }

  return {
    rules,
    earlyBirdMinutes: clampInt(input.earlyBirdMinutes, DEFAULT_SCORING.earlyBirdMinutes, 1, 240),
    taskEarlyHours: clampInt(input.taskEarlyHours, DEFAULT_SCORING.taskEarlyHours, 1, 168),
    perfectWeekDays: clampInt(input.perfectWeekDays, DEFAULT_SCORING.perfectWeekDays, 2, 7),
    comebackRunLength: clampInt(input.comebackRunLength, DEFAULT_SCORING.comebackRunLength, 2, 30),
    dailyTaskCap: clampInt(input.dailyTaskCap, DEFAULT_SCORING.dailyTaskCap, 0, 10_000),
  };
}

// ------------------------------------------------------------------ awards

/** One award the ledger will record. */
export interface Award {
  kind: RuleKey;
  points: number;
  note: string;
}

/** An enabled rule with points becomes an award; anything else is nothing. */
function award(policy: ScoringPolicy, kind: RuleKey, note?: string): Award | null {
  const rule = policy.rules[kind];
  if (!rule.enabled || rule.points <= 0) return null;
  return { kind, points: rule.points, note: note ?? RULE_LABELS[kind] };
}

// --------------------------------------------------------------- streaks

export type DayStanding =
  | "on_time" // checked in, not late
  | "leave" // approved leave — pauses a streak, never breaks it
  | "break"; // late, absent, or anything else

/**
 * Consecutive on-time days ending with (and including) the most recent
 * entry. `days` is ordered MOST RECENT FIRST. Leave days are skipped, not
 * broken on — punishing sanctioned absence teaches people not to take
 * leave (PERFORMANCE-MODULE.md §1.8).
 */
export function currentStreak(days: readonly DayStanding[]): number {
  let streak = 0;
  for (const day of days) {
    if (day === "on_time") streak += 1;
    else if (day === "leave") continue;
    else break;
  }
  return streak;
}

/** Had this person ever built a streak of `runLength` that later broke? */
export function hasBrokenRun(
  days: readonly DayStanding[],
  runLength: number,
): boolean {
  // Walk oldest→newest counting runs that were interrupted by a break.
  let run = 0;
  let sawQualifyingRunBeforeABreak = false;
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i];
    if (day === "on_time") run += 1;
    else if (day === "leave") continue;
    else {
      if (run >= runLength) sawQualifyingRunBeforeABreak = true;
      run = 0;
    }
  }
  return sawQualifyingRunBeforeABreak;
}

// ----------------------------------------------------------- check-in etc.

export interface CheckInFacts {
  /** Not late after grace, and location did not need review (or review approved). */
  onTime: boolean;
  /** Minutes before shift start the check-in happened (0 if after). */
  minutesBeforeShift: number;
  /** Only the day's first punch can score (multiple-punch rule). */
  isFirstPunchOfDay: boolean;
  /** Streak INCLUDING today, computed from attendance + approved leave. */
  streakIncludingToday: number;
  /** True when a run of `comebackRunLength` had previously been broken. */
  hadEarlierBrokenRun: boolean;
  /** On-time days in the current week, INCLUDING today. */
  onTimeDaysThisWeek: number;
}

/** Everything a finalised check-in can earn. */
export function checkInAwards(policy: ScoringPolicy, facts: CheckInFacts): Award[] {
  if (!facts.onTime || !facts.isFirstPunchOfDay) return [];

  const awards: Award[] = [];
  const push = (a: Award | null) => a && awards.push(a);

  push(award(policy, "on_time"));

  if (facts.minutesBeforeShift >= policy.earlyBirdMinutes) {
    push(
      award(
        policy,
        "early_bird",
        `Early bird — ${facts.minutesBeforeShift} min before shift`,
      ),
    );
  }

  if (facts.streakIncludingToday === 7) push(award(policy, "streak_7"));
  if (facts.streakIncludingToday === 30) push(award(policy, "streak_30"));
  if (facts.streakIncludingToday === 100) push(award(policy, "streak_100"));

  if (
    facts.streakIncludingToday === policy.comebackRunLength &&
    facts.hadEarlierBrokenRun
  ) {
    push(award(policy, "comeback"));
  }

  if (facts.onTimeDaysThisWeek === policy.perfectWeekDays) {
    push(
      award(
        policy,
        "perfect_week",
        `Perfect week — on time ${policy.perfectWeekDays} days`,
      ),
    );
  }

  return awards;
}

/** A recorded check-out completes the day. */
export function checkOutAwards(policy: ScoringPolicy): Award[] {
  const a = award(policy, "full_day");
  return a ? [a] : [];
}

// ------------------------------------------------------------------- tasks

export interface TaskFacts {
  /** Completed on/before the due date (true when no due date is set). */
  onTime: boolean;
  /** Hours between completion and the due moment; null without a due date. */
  hoursBeforeDue: number | null;
  highPriority: boolean;
  /** This is the first task the person completed today, before noon local. */
  isFirstTaskBeforeNoon: boolean;
}

/** Everything a completed task can earn (cap applied separately). */
export function taskAwards(policy: ScoringPolicy, facts: TaskFacts): Award[] {
  const awards: Award[] = [];
  const push = (a: Award | null) => a && awards.push(a);

  push(award(policy, "task_completed"));
  if (facts.onTime) push(award(policy, "task_on_time"));
  if (facts.hoursBeforeDue != null && facts.hoursBeforeDue >= policy.taskEarlyHours) {
    push(award(policy, "task_early"));
  }
  if (facts.highPriority) push(award(policy, "task_priority"));
  if (facts.isFirstTaskBeforeNoon) push(award(policy, "first_task_before_noon"));

  return awards;
}

export interface ProofFacts {
  /** No earlier "details requested" round on this task's proofs. */
  firstTimeRight: boolean;
}

/** Accepted proof earns on top of the task itself. */
export function proofAwards(policy: ScoringPolicy, facts: ProofFacts): Award[] {
  const awards: Award[] = [];
  const push = (a: Award | null) => a && awards.push(a);
  push(award(policy, "proof_accepted"));
  if (facts.firstTimeRight) push(award(policy, "proof_first_time"));
  return awards;
}

/** Which rule kinds count against the daily task cap. */
export const TASK_CAPPED_KINDS: readonly RuleKey[] = [
  "task_completed",
  "task_on_time",
  "task_early",
  "task_priority",
  "proof_accepted",
  "proof_first_time",
  "first_task_before_noon",
];

/**
 * The transparent anti-farming rule: task-derived points stop at the
 * daily cap. Awards are truncated in order; a partially fitting award is
 * NOT split — a person sees whole rules earn or not earn, never "+3 of
 * +5", which would be impossible to explain on the ledger.
 */
export function applyDailyTaskCap(
  policy: ScoringPolicy,
  taskPointsAlreadyToday: number,
  awards: readonly Award[],
): Award[] {
  if (policy.dailyTaskCap <= 0) return [...awards];
  let used = taskPointsAlreadyToday;
  const kept: Award[] = [];
  for (const a of awards) {
    if (!TASK_CAPPED_KINDS.includes(a.kind)) {
      kept.push(a);
      continue;
    }
    if (used + a.points <= policy.dailyTaskCap) {
      kept.push(a);
      used += a.points;
    }
  }
  return kept;
}

// ---------------------------------------------------------------- periods

/** "2026-W34" — the dedupe key for week-scoped aggregates. Monday-based. */
export function weekKey(date: Date): string {
  // ISO week number, computed in UTC on a date-only value.
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Mon=1..Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - day); // nearest Thursday decides the year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
