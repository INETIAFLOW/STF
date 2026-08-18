import "server-only";

import { getDb } from "@/lib/db";
import { getPolicy, getPolicyVersion } from "@/lib/policies";
import { loadEntitlements } from "@/lib/authz/entitlements";
import { evaluateAccess } from "@/lib/authz/flags";
import type { AppSession } from "@/lib/auth/types";
import {
  applyDailyTaskCap,
  checkInAwards,
  checkOutAwards,
  currentStreak,
  hasBrokenRun,
  normalizeScoring,
  proofAwards,
  taskAwards,
  weekKey,
  TASK_CAPPED_KINDS,
  type Award,
  type DayStanding,
  type ScoringPolicy,
} from "./scoring";
import { minutesInTimezone, workDateInTimezone } from "@/lib/attendance/policy";

/**
 * Awarding — the seam between recorded evidence and the points ledger.
 *
 * Called from inside the existing server actions at the moment an event
 * becomes final (the notifications pattern; no job runner). Every entry
 * point here is deliberately fail-quiet: a scoring hiccup must never make
 * a check-in or a task review fail — the evidence is the product, the
 * points are the motivation on top.
 *
 * Nothing is written unless the module is enabled AND a scoring
 * definition has been published (PERFORMANCE-MODULE.md §1.2: points only
 * count after publish). Duplicates are impossible at the database level
 * — the unique (tenant, member, kind, dedupeKey) index — so retries and
 * double-submissions cannot double-pay.
 */

interface ScoringState {
  policy: ScoringPolicy;
  version: number;
}

/** Null when the module is off or no definition has been published. */
async function scoringStateFor(session: AppSession): Promise<ScoringState | null> {
  const entitlements = await loadEntitlements(session.tenant.id, session.user.id);
  const moduleOn = evaluateAccess({
    session,
    entitlements,
    module: "PERFORMANCE",
  }).allowed;
  if (!moduleOn) return null;

  const raw = await getPolicy<unknown>(session.tenant.id, "performance");
  if (raw == null) return null; // not published yet — points do not count

  const version = await getPolicyVersion(session.tenant.id, "performance");
  return { policy: normalizeScoring(raw), version };
}

async function writeAwards(input: {
  session: AppSession;
  membershipId: string;
  workDate: Date;
  awards: readonly Award[];
  sourceType: string;
  sourceId: string | null;
  dedupeKeyFor: (award: Award) => string;
  version: number;
}): Promise<void> {
  if (input.awards.length === 0) return;
  await getDb().performanceEvent.createMany({
    data: input.awards.map((a) => ({
      tenantId: input.session.tenant.id,
      membershipId: input.membershipId,
      workDate: input.workDate,
      kind: a.kind,
      points: a.points,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      dedupeKey: input.dedupeKeyFor(a),
      policyVersion: input.version,
      note: a.note,
    })),
    // The unique index is the idempotency rule; a retried queue action or
    // a double-tap simply writes nothing the second time.
    skipDuplicates: true,
  });
}

/**
 * Day standings for streak maths, most recent day first.
 *
 * The transparent streak rule (shown verbatim on "How points work"):
 * every worked day you arrived on time extends the streak; arriving late
 * breaks it; days you didn't work — leave, weekly off — don't break it
 * and don't extend it. Without a working-day calendar (explicitly out of
 * V1, D-P3-03) "absent" and "day off" are indistinguishable, so the rule
 * is kind by design rather than wrong half the time.
 */
async function dayStandings(
  session: AppSession,
  membershipId: string,
  before: Date,
  days = 130,
): Promise<DayStanding[]> {
  const since = new Date(before.getTime() - days * 86_400_000);
  const records = await getDb().attendanceRecord.findMany({
    where: {
      tenantId: session.tenant.id,
      membershipId,
      workDate: { gte: since, lt: before },
      checkInAt: { not: null },
    },
    select: { workDate: true, lateMinutes: true, reviewStatus: true, exemptionStatus: true },
    orderBy: { workDate: "desc" },
  });

  const byDay = new Map<string, DayStanding>();
  for (const r of records) {
    const key = r.workDate.toISOString().slice(0, 10);
    const late = r.lateMinutes > 0 && r.exemptionStatus !== "EXEMPTED";
    const rejected = r.reviewStatus === "REJECTED";
    byDay.set(key, late || rejected ? "break" : "on_time");
  }

  // Walk day by day; unrecorded days read as "leave" (skipped) per the
  // rule above.
  const standings: DayStanding[] = [];
  for (let i = 1; i <= days; i++) {
    const day = new Date(before.getTime() - i * 86_400_000)
      .toISOString()
      .slice(0, 10);
    standings.push(byDay.get(day) ?? "leave");
  }
  return standings;
}

/** Sum of today's already-awarded task-capped points. */
async function taskPointsToday(
  session: AppSession,
  membershipId: string,
  workDate: Date,
): Promise<number> {
  const rows = await getDb().performanceEvent.findMany({
    where: {
      tenantId: session.tenant.id,
      membershipId,
      workDate,
      kind: { in: [...TASK_CAPPED_KINDS] },
    },
    select: { points: true },
  });
  return rows.reduce((sum, r) => sum + r.points, 0);
}

// ------------------------------------------------------------- entry points

/**
 * A check-in became final: on time at the time (INSIDE / NOT_REQUIRED),
 * or an outside/unconfirmed one that review just APPROVED.
 */
export async function awardForCheckIn(input: {
  session: AppSession;
  membershipId: string;
  recordId: string;
  workDate: Date;
  effectiveAt: Date;
  lateMinutes: number;
  shiftStartMinutes: number;
  isFirstPunchOfDay: boolean;
  /** True on the retro path (review approval) — milestones don't re-fire. */
  retro?: boolean;
}): Promise<void> {
  try {
    const state = await scoringStateFor(input.session);
    if (!state) return;
    if (input.lateMinutes > 0) return; // late earns nothing, costs nothing

    const tz = input.session.tenant.timezone;
    const minuteOfDay = minutesInTimezone(input.effectiveAt, tz);
    const minutesBeforeShift = Math.max(0, input.shiftStartMinutes - minuteOfDay);

    let streakIncludingToday = 1;
    let hadEarlierBrokenRun = false;
    let onTimeDaysThisWeek = 1;

    // Streak and week maths only on the live path: a retro approval days
    // later cannot honestly reconstruct "the streak as it stood then",
    // and a milestone that fires on the wrong day reads as a lie on the
    // ledger. The base points are what review approval restores.
    if (!input.retro) {
      const standings = await dayStandings(
        input.session,
        input.membershipId,
        input.workDate,
      );
      streakIncludingToday = 1 + currentStreak(standings);
      hadEarlierBrokenRun = hasBrokenRun(standings, state.policy.comebackRunLength);

      const thisWeek = weekKey(input.workDate);
      let count = 1;
      for (let i = 0; i < standings.length; i++) {
        const day = new Date(input.workDate.getTime() - (i + 1) * 86_400_000);
        if (weekKey(day) !== thisWeek) break;
        if (standings[i] === "on_time") count += 1;
      }
      onTimeDaysThisWeek = count;
    }

    const awards = checkInAwards(state.policy, {
      onTime: true,
      minutesBeforeShift,
      isFirstPunchOfDay: input.isFirstPunchOfDay,
      streakIncludingToday,
      hadEarlierBrokenRun,
      onTimeDaysThisWeek,
    });

    const dayKey = input.workDate.toISOString().slice(0, 10);
    await writeAwards({
      session: input.session,
      membershipId: input.membershipId,
      workDate: input.workDate,
      awards,
      sourceType: "attendance_record",
      sourceId: input.recordId,
      dedupeKeyFor: (a) =>
        a.kind === "perfect_week"
          ? weekKey(input.workDate) // one per week
          : a.kind === "on_time" || a.kind === "early_bird"
            ? input.recordId // one per record
            : dayKey, // milestones/comeback: one per day they landed
      version: state.version,
    });
  } catch (error) {
    console.error("[performance] check-in award failed:", error);
  }
}

/** A check-out completed the day. */
export async function awardForCheckOut(input: {
  session: AppSession;
  membershipId: string;
  recordId: string;
  workDate: Date;
}): Promise<void> {
  try {
    const state = await scoringStateFor(input.session);
    if (!state) return;
    await writeAwards({
      session: input.session,
      membershipId: input.membershipId,
      workDate: input.workDate,
      awards: checkOutAwards(state.policy),
      sourceType: "attendance_record",
      sourceId: input.recordId,
      dedupeKeyFor: () => input.recordId,
      version: state.version,
    });
  } catch (error) {
    console.error("[performance] check-out award failed:", error);
  }
}

/**
 * A task reached COMPLETED — directly, or via an approved proof. The
 * session may belong to the REVIEWER; points always go to the assignee.
 */
export async function awardForTaskCompletion(input: {
  session: AppSession;
  assigneeMembershipId: string;
  taskId: string;
  completedAt: Date;
  dueDate: Date | null;
  dueMinutes: number | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  /** Facts about proof, when the completion came through review. */
  proof?: { firstTimeRight: boolean };
}): Promise<void> {
  try {
    const state = await scoringStateFor(input.session);
    if (!state) return;

    const tz = input.session.tenant.timezone;
    const workDate = workDateInTimezone(input.completedAt, tz);

    // Punctuality at DATE granularity, in the tenant's timezone — the same
    // precision the task screens show ("Due 20 Aug"). Composing an exact
    // due instant from a date column plus minutes would silently be off by
    // the timezone offset, and a scoring rule that is 5½ hours generous is
    // not a rule anyone can explain.
    let hoursBeforeDue: number | null = null;
    let onTime = true;
    if (input.dueDate) {
      const daysBeforeDue = Math.round(
        (input.dueDate.getTime() - workDate.getTime()) / 86_400_000,
      );
      onTime = daysBeforeDue >= 0;
      hoursBeforeDue = daysBeforeDue > 0 ? daysBeforeDue * 24 : null;
    }

    // First completed task of the day, before noon local time?
    const noonLocal = minutesInTimezone(input.completedAt, tz) < 12 * 60;
    const earlierToday = noonLocal
      ? await getDb().performanceEvent.count({
          where: {
            tenantId: input.session.tenant.id,
            membershipId: input.assigneeMembershipId,
            workDate,
            kind: "task_completed",
          },
        })
      : 1;

    const base = taskAwards(state.policy, {
      onTime,
      hoursBeforeDue,
      highPriority: input.priority === "HIGH",
      isFirstTaskBeforeNoon: noonLocal && earlierToday === 0,
    });
    const withProof = input.proof
      ? [...base, ...proofAwards(state.policy, input.proof)]
      : base;

    const alreadyToday = await taskPointsToday(
      input.session,
      input.assigneeMembershipId,
      workDate,
    );
    const capped = applyDailyTaskCap(state.policy, alreadyToday, withProof);

    await writeAwards({
      session: input.session,
      membershipId: input.assigneeMembershipId,
      workDate,
      awards: capped,
      sourceType: "task",
      sourceId: input.taskId,
      dedupeKeyFor: () => input.taskId, // every kind at most once per task
      version: state.version,
    });
  } catch (error) {
    console.error("[performance] task award failed:", error);
  }
}
