"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { checkAccess } from "@/lib/authz/guard";
import { getPolicyVersion } from "@/lib/policies";
import {
  computeCheckInState,
  workDateInTimezone,
  formatClockTime,
  formatDistance,
  type AttendanceContext,
  type AttendanceSnapshot,
  type CheckInState,
} from "./policy";
import { loadAttendanceContext } from "./service";

/**
 * What was true when the record was written, captured by value so a later
 * rename, move or policy change cannot alter what a past day says.
 * Prisma's Json input needs a plain object, hence the round trip.
 */
function buildSnapshot(
  context: AttendanceContext,
  state: CheckInState,
  policyVersion: number,
): AttendanceSnapshot {
  const matched = state.location.branch;
  const home = context.homeBranch;
  return {
    v: 2,
    policyVersion,
    locationRequired: context.locationRequired,
    canCheckInAtAnyBranch: context.canCheckInAtAnyBranch,
    shift: context.shift,
    homeBranch: home
      ? { id: home.id, name: home.name, lat: home.lat, lng: home.lng, radiusM: home.radiusM }
      : null,
    matchedBranch: matched
      ? {
          id: matched.id,
          name: matched.name,
          lat: matched.lat,
          lng: matched.lng,
          radiusM: matched.radiusM,
        }
      : null,
    candidateBranchCount: context.branches.length,
    outcome: state.location.outcome,
    distanceM: state.location.distanceM,
    consequenceSentence: state.consequence?.sentence ?? null,
  };
}

/** Prisma Json input requires plain JSON; our interfaces are precise. */
function toJson<T>(value: T): Parameters<typeof JSON.stringify>[0] {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Attendance server actions.
 *
 * Non-negotiables enforced here (not in the UI):
 * - Server time is authoritative and is echoed back to the user.
 * - Outside-area or unconfirmed location REQUIRES a reason and creates a
 *   pending exception — never a silent pass or block.
 * - Duplicate taps are idempotent within the day (edge-cases.md).
 * - Never invent a check-out time for a missed punch.
 * - Every state change writes an audit event (Constitution §3).
 */

const coordsSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracyM: z.number().nonnegative().nullable().optional(),
  })
  .nullable();

const checkInSchema = z.object({
  coords: coordsSchema,
  reason: z.string().trim().max(500).optional(),
  /** Original device capture time for offline-queued check-ins. */
  clientCapturedAt: z.string().datetime().optional(),
});

export type ActionResult =
  | { ok: true; message: string; detail?: string }
  | { ok: false; error: string };

export async function checkInAction(
  input: z.input<typeof checkInSchema>,
): Promise<ActionResult> {
  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "That check-in could not be read. Try again." };
  }

  const { session, decision } = await checkAccess({ module: "ATTENDANCE" });
  if (!decision.allowed) {
    return { ok: false, error: decision.message ?? "You don't have access to this." };
  }

  const db = getDb();
  const now = new Date(); // server time wins
  const context = await loadAttendanceContext(session);
  const state = computeCheckInState(context, parsed.data.coords ?? null, now);

  // A consequence that requires a reason must have one — server-side.
  const reason = parsed.data.reason?.trim();
  if (state.consequence?.requiresReason && !reason) {
    return {
      ok: false,
      error: "Add a reason so your manager can approve this check-in.",
    };
  }

  const workDate = workDateInTimezone(now, session.tenant.timezone);
  const existing = await db.attendanceRecord.findUnique({
    where: {
      tenantId_membershipId_workDate: {
        tenantId: session.tenant.id,
        membershipId: session.membership.id,
        workDate,
      },
    },
  });

  // Idempotent: a second tap produces no second record and no error.
  if (existing?.checkInAt) {
    return {
      ok: true,
      message: `Checked in at ${formatClockTime(existing.checkInAt, session.tenant.timezone)}`,
      detail: "This is already recorded for today.",
    };
  }

  const needsReview =
    state.location.outcome === "OUTSIDE" ||
    state.location.outcome === "UNCONFIRMED";

  const policyVersion = await getPolicyVersion(session.tenant.id, "attendance");
  const snapshot = toJson(buildSnapshot(context, state, policyVersion));
  // The location this was JUDGED against — for roaming staff that need not
  // be their home location.
  const matchedBranchId = state.location.branch?.id ?? context.homeBranch?.id;

  const record = await db.attendanceRecord.upsert({
    where: {
      tenantId_membershipId_workDate: {
        tenantId: session.tenant.id,
        membershipId: session.membership.id,
        workDate,
      },
    },
    update: {
      checkInAt: now,
      checkInClientAt: parsed.data.clientCapturedAt
        ? new Date(parsed.data.clientCapturedAt)
        : null,
      checkInLat: parsed.data.coords?.lat,
      checkInLng: parsed.data.coords?.lng,
      checkInAccuracyM: parsed.data.coords?.accuracyM ?? null,
      checkInDistanceM: state.location.distanceM,
      checkInOutcome: state.location.outcome,
      checkInReason: reason,
      lateMinutes: state.lateBy,
      reviewStatus: needsReview ? "PENDING" : "NONE",
      branchId: matchedBranchId,
      offlineCaptured: Boolean(parsed.data.clientCapturedAt),
      policySnapshot: snapshot,
    },
    create: {
      tenantId: session.tenant.id,
      membershipId: session.membership.id,
      workDate,
      checkInAt: now,
      checkInClientAt: parsed.data.clientCapturedAt
        ? new Date(parsed.data.clientCapturedAt)
        : null,
      checkInLat: parsed.data.coords?.lat,
      checkInLng: parsed.data.coords?.lng,
      checkInAccuracyM: parsed.data.coords?.accuracyM ?? null,
      checkInDistanceM: state.location.distanceM,
      checkInOutcome: state.location.outcome,
      checkInReason: reason,
      lateMinutes: state.lateBy,
      reviewStatus: needsReview ? "PENDING" : "NONE",
      branchId: matchedBranchId,
      offlineCaptured: Boolean(parsed.data.clientCapturedAt),
      policySnapshot: snapshot,
    },
  });

  await recordAuditEvent(session, {
    action: "attendance.checkin",
    entityType: "attendance_record",
    entityId: record.id,
    reason,
    after: {
      checkInAt: now.toISOString(),
      lateMinutes: state.lateBy,
      outcome: state.location.outcome,
      distanceM: state.location.distanceM,
      branch: state.location.branch?.name ?? null,
      awayFromHomeBranch:
        state.location.branch != null &&
        context.homeBranch != null &&
        state.location.branch.id !== context.homeBranch.id,
    },
  });

  if (needsReview) {
    await notify.attendanceException(session, record.id);
  }

  revalidatePath("/home");
  revalidatePath("/attendance");

  const time = formatClockTime(now, session.tenant.timezone);
  if (needsReview) {
    const where =
      state.location.distanceM != null
        ? ` · ${formatDistance(state.location.distanceM)} outside the area`
        : "";
    return {
      ok: true,
      message: `Checked in at ${time}${where}`,
      detail: "Sent to your manager for approval.",
    };
  }
  if (state.lateBy > 0) {
    return {
      ok: true,
      message: `Checked in at ${time}`,
      detail: `Late by ${state.lateBy} min · sent for review.`,
    };
  }
  // "Recorded at {branch}" (copy-deck.md §5) — worth saying when someone
  // has checked in somewhere other than their usual place of work.
  const awayFromHome =
    state.location.branch != null &&
    context.homeBranch != null &&
    state.location.branch.id !== context.homeBranch.id;
  const firstName = session.user.displayName.split(/\s+/)[0];
  return {
    ok: true,
    message: `Checked in at ${time}`,
    detail: awayFromHome
      ? `Recorded at ${state.location.branch?.name}. Have a good shift, ${firstName}.`
      : `Have a good shift, ${firstName}.`,
  };
}

const checkOutSchema = z.object({ coords: coordsSchema });

export async function checkOutAction(
  input: z.input<typeof checkOutSchema>,
): Promise<ActionResult> {
  const parsed = checkOutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "That check-out could not be read. Try again." };
  }

  const { session, decision } = await checkAccess({ module: "ATTENDANCE" });
  if (!decision.allowed) {
    return { ok: false, error: decision.message ?? "You don't have access to this." };
  }

  const db = getDb();
  const now = new Date();
  const workDate = workDateInTimezone(now, session.tenant.timezone);

  const record = await db.attendanceRecord.findUnique({
    where: {
      tenantId_membershipId_workDate: {
        tenantId: session.tenant.id,
        membershipId: session.membership.id,
        workDate,
      },
    },
  });

  if (!record?.checkInAt) {
    return {
      ok: false,
      error: "You haven't checked in today. Check in first, or ask your manager to record it.",
    };
  }
  if (record.checkOutAt) {
    return {
      ok: true,
      message: `Checked out at ${formatClockTime(record.checkOutAt, session.tenant.timezone)}`,
      detail: "This is already recorded for today.",
    };
  }

  const context = await loadAttendanceContext(session);
  const state = computeCheckInState(context, parsed.data.coords ?? null, now);

  await db.attendanceRecord.update({
    where: { id: record.id },
    data: {
      checkOutAt: now,
      checkOutLat: parsed.data.coords?.lat,
      checkOutLng: parsed.data.coords?.lng,
      checkOutOutcome: state.location.outcome,
    },
  });

  await recordAuditEvent(session, {
    action: "attendance.checkout",
    entityType: "attendance_record",
    entityId: record.id,
    after: {
      checkOutAt: now.toISOString(),
      outcome: state.location.outcome,
      branch: state.location.branch?.name ?? null,
    },
  });

  revalidatePath("/home");
  revalidatePath("/attendance");

  return {
    ok: true,
    message: `Checked out at ${formatClockTime(now, session.tenant.timezone)}`,
    detail: "Your hours for today are recorded.",
  };
}

/** Admin/manager decision on an attendance exception (Approval card). */
const reviewSchema = z.object({
  recordId: z.string().uuid(),
  decision: z.enum(["APPROVED", "REJECTED", "DETAILS_REQUESTED"]),
  reason: z.string().trim().max(500).optional(),
});

export async function reviewAttendanceAction(
  input: z.input<typeof reviewSchema>,
): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "That decision could not be read. Try again." };
  }

  const { session, decision: access } = await checkAccess({
    module: "ATTENDANCE",
    permission: "attendance.review",
  });
  if (!access.allowed) {
    return { ok: false, error: access.message ?? "You don't have access to this." };
  }

  // Reject ALWAYS requires a reason (Constitution §3, Approval card).
  const reason = parsed.data.reason?.trim();
  if (parsed.data.decision === "REJECTED" && !reason) {
    return { ok: false, error: "Add a reason so the employee knows why." };
  }

  const db = getDb();
  const record = await db.attendanceRecord.findFirst({
    where: { id: parsed.data.recordId, tenantId: session.tenant.id },
    include: { membership: { include: { user: true } } },
  });
  if (!record) {
    return { ok: false, error: "That record is no longer available." };
  }

  // Stale decision: another admin already decided (edge-cases.md).
  if (record.reviewStatus !== "PENDING") {
    const who = record.reviewedAt
      ? ` at ${formatClockTime(record.reviewedAt, session.tenant.timezone)}`
      : "";
    return {
      ok: false,
      error: `Already decided${who}. Open the activity log to see who decided.`,
    };
  }

  const before = {
    reviewStatus: record.reviewStatus,
    lateMinutes: record.lateMinutes,
  };

  await db.attendanceRecord.update({
    where: { id: record.id },
    data: {
      reviewStatus: parsed.data.decision,
      reviewedById: session.membership.id,
      reviewedAt: new Date(),
      reviewReason: reason,
    },
  });

  await recordAuditEvent(session, {
    action: `attendance.exception_${parsed.data.decision.toLowerCase()}`,
    entityType: "attendance_record",
    entityId: record.id,
    reason,
    before,
    after: { reviewStatus: parsed.data.decision },
  });

  await notify.attendanceDecision(
    session,
    record.membership.userId,
    parsed.data.decision,
    reason,
  );

  revalidatePath("/admin/attendance");
  revalidatePath("/admin");

  const name = record.membership.user.displayName;
  if (parsed.data.decision === "APPROVED") {
    return { ok: true, message: `Approved. ${name}'s attendance is updated.` };
  }
  if (parsed.data.decision === "REJECTED") {
    return { ok: true, message: `Rejected. ${name} has been told why.` };
  }
  return { ok: true, message: `Details requested from ${name}.` };
}
