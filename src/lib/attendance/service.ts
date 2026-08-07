import "server-only";

import { getDb } from "@/lib/db";
import type { AppSession } from "@/lib/auth/types";
import { loadEntitlements } from "@/lib/authz/entitlements";
import { evaluateAccess } from "@/lib/authz/flags";
import {
  assessLocation,
  checkInConsequence,
  lateMinutes,
  minutesInTimezone,
  workDateInTimezone,
  type Consequence,
  type LocationAssessment,
} from "./policy";

/**
 * Attendance read model — resolves policy + today's record for a session.
 * Every query is tenant-scoped from the session, never from client input
 * (Constitution §2).
 */
export interface TodayAttendance {
  recordId: string | null;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  lateMinutes: number;
  reviewStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED" | "DETAILS_REQUESTED";
  exemptionStatus: "NONE" | "REQUESTED" | "EXEMPTED" | "DECLINED";
  checkInOutcome: LocationAssessment["outcome"] | null;
  checkInDistanceM: number | null;
  offlineCaptured: boolean;
}

export interface AttendanceContext {
  timezone: string;
  branch: { id: string; name: string; lat: number | null; lng: number | null; radiusM: number } | null;
  shift: { name: string; startMinutes: number; endMinutes: number; graceMinutes: number } | null;
  locationRequired: boolean;
  today: TodayAttendance | null;
}

const DEFAULT_SHIFT = {
  name: "General shift",
  startMinutes: 9 * 60 + 30,
  endMinutes: 18 * 60 + 30,
  graceMinutes: 10,
};

/** Load everything the check-in screen needs for the current session. */
export async function loadAttendanceContext(
  session: AppSession,
): Promise<AttendanceContext> {
  const db = getDb();
  const entitlements = await loadEntitlements(
    session.tenant.id,
    session.user.id,
  );
  const locationRequired = evaluateAccess({
    session,
    entitlements,
    module: "ATTENDANCE",
    feature: "geofence",
  }).allowed;

  const membership = await db.tenantMembership.findUnique({
    where: { id: session.membership.id },
    include: { branch: true, shift: true },
  });

  const fallbackShift = membership?.shift
    ? null
    : await db.shift.findFirst({
        where: { tenantId: session.tenant.id, isDefault: true },
      });

  const shift = membership?.shift ?? fallbackShift ?? DEFAULT_SHIFT;
  const workDate = workDateInTimezone(new Date(), session.tenant.timezone);

  const record = await db.attendanceRecord.findUnique({
    where: {
      tenantId_membershipId_workDate: {
        tenantId: session.tenant.id,
        membershipId: session.membership.id,
        workDate,
      },
    },
  });

  return {
    timezone: session.tenant.timezone,
    branch: membership?.branch
      ? {
          id: membership.branch.id,
          name: membership.branch.name,
          lat: membership.branch.lat,
          lng: membership.branch.lng,
          radiusM: membership.branch.radiusM,
        }
      : null,
    shift: {
      name: shift.name,
      startMinutes: shift.startMinutes,
      endMinutes: shift.endMinutes,
      graceMinutes: shift.graceMinutes,
    },
    locationRequired,
    today: record
      ? {
          recordId: record.id,
          checkInAt: record.checkInAt,
          checkOutAt: record.checkOutAt,
          lateMinutes: record.lateMinutes,
          reviewStatus: record.reviewStatus,
          exemptionStatus: record.exemptionStatus,
          checkInOutcome: record.checkInOutcome,
          checkInDistanceM: record.checkInDistanceM,
          offlineCaptured: record.offlineCaptured,
        }
      : null,
  };
}

/**
 * Compute the consequence for checking in right now, given the device's
 * reported position. Used by the server action AND echoed to the client so
 * the sentence shown before the tap is the sentence that gets recorded.
 */
export function computeCheckInState(
  context: AttendanceContext,
  coords: { lat: number; lng: number; accuracyM?: number | null } | null,
  now: Date,
): {
  location: LocationAssessment;
  lateBy: number;
  consequence: Consequence | null;
} {
  const location = assessLocation({
    locationRequired: context.locationRequired,
    branch: context.branch
      ? {
          name: context.branch.name,
          lat: context.branch.lat,
          lng: context.branch.lng,
          radiusM: context.branch.radiusM,
        }
      : null,
    coords,
  });

  const shift = context.shift ?? DEFAULT_SHIFT;
  const lateBy = lateMinutes(
    minutesInTimezone(now, context.timezone),
    shift,
  );

  return {
    location,
    lateBy,
    consequence: checkInConsequence({
      location,
      lateBy,
      branchName: context.branch?.name,
    }),
  };
}
