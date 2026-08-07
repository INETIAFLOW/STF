/**
 * Attendance policy logic — pure functions, no I/O.
 *
 * Rules come from the approved documents:
 * - Grace is INCLUSIVE: exactly `graceMinutes` late is NOT late
 *   (edge-cases.md → "Late exactly at the grace boundary").
 * - GPS accuracy worse than 200 m cannot confirm the area; it becomes the
 *   outside-area approval path, never a silent pass or silent block.
 * - Consequences are computed, never generic
 *   (design-system-implementation-guide.md §5, decision D-011).
 *
 * Server time is authoritative for every recorded event; these helpers
 * receive the already-resolved server timestamp.
 */

export type LocationOutcome =
  | "INSIDE"
  | "OUTSIDE"
  | "UNCONFIRMED"
  | "NOT_REQUIRED";

/** Worst GPS accuracy that can still confirm a permitted area. */
export const MAX_ACCURACY_M = 200;

export interface ShiftPolicy {
  startMinutes: number;
  endMinutes: number;
  graceMinutes: number;
}

export interface BranchPolicy {
  name: string;
  lat: number | null;
  lng: number | null;
  radiusM: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
  accuracyM?: number | null;
}

/** Great-circle distance in metres (haversine). */
export function distanceMetres(a: Coordinates, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface LocationAssessment {
  outcome: LocationOutcome;
  distanceM: number | null;
  /** Employee-facing wording — "permitted area", never "geofence". */
  label: string;
}

/**
 * Assess where the person is relative to their permitted area.
 * `locationRequired` is the resolved feature flag (geofence/gps_capture).
 */
export function assessLocation(input: {
  locationRequired: boolean;
  branch: BranchPolicy | null;
  coords: Coordinates | null;
}): LocationAssessment {
  const { locationRequired, branch, coords } = input;

  if (!locationRequired || !branch || branch.lat == null || branch.lng == null) {
    return { outcome: "NOT_REQUIRED", distanceM: null, label: "" };
  }

  if (!coords) {
    return {
      outcome: "UNCONFIRMED",
      distanceM: null,
      label: "Location is off",
    };
  }

  if (coords.accuracyM != null && coords.accuracyM > MAX_ACCURACY_M) {
    return {
      outcome: "UNCONFIRMED",
      distanceM: null,
      label: "Location could not be confirmed",
    };
  }

  const distanceM = distanceMetres(coords, {
    lat: branch.lat,
    lng: branch.lng,
  });

  if (distanceM <= branch.radiusM) {
    return {
      outcome: "INSIDE",
      distanceM,
      label: `Inside ${branch.name} area`,
    };
  }

  return {
    outcome: "OUTSIDE",
    distanceM,
    label: `Outside permitted area — ${formatDistance(distanceM)} away`,
  };
}

/** "1.4 km" / "320 m" — the copy deck's distance shape. */
export function formatDistance(metres: number): string {
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`;
  return `${Math.round(metres)} m`;
}

/**
 * Minutes late against the shift start, applying the inclusive grace rule.
 * `nowMinutes` is minutes-from-midnight in the tenant's timezone.
 */
export function lateMinutes(
  nowMinutes: number,
  shift: ShiftPolicy,
): number {
  const past = nowMinutes - shift.startMinutes;
  if (past <= shift.graceMinutes) return 0; // grace is inclusive
  return past;
}

/**
 * The consequence contract (implementation guide §5): a computed sentence
 * rendered before the control AND appended to its accessible name.
 * A generic fallback is not acceptable.
 */
export interface Consequence {
  sentence: string;
  detail?: string;
  requiresReason: boolean;
}

export function checkInConsequence(input: {
  location: LocationAssessment;
  lateBy: number;
  branchName?: string;
}): Consequence | null {
  const { location, lateBy, branchName } = input;

  if (location.outcome === "OUTSIDE" && location.distanceM != null) {
    return {
      sentence: `You are ${formatDistance(location.distanceM)} outside the ${branchName ?? "branch"} area.`,
      detail:
        "You can still check in. It will be sent to your manager for approval with your reason.",
      requiresReason: true,
    };
  }

  if (location.outcome === "UNCONFIRMED") {
    return {
      sentence: "Your location could not be confirmed.",
      detail:
        "You can still check in. It will be sent to your manager for approval with your reason.",
      requiresReason: true,
    };
  }

  if (lateBy > 0) {
    return {
      sentence: `Checking in now will record a late arrival of ${lateBy} minutes.`,
      detail: "Your manager will see this in today's attendance review.",
      requiresReason: false,
    };
  }

  return null;
}

/** Button label follows the consequence (copy-deck.md §2). */
export function checkInButtonLabel(consequence: Consequence | null): string {
  return consequence?.requiresReason ? "Check In — needs approval" : "Check In";
}

/** Duration in data contexts is `h:mm` (implementation guide §8). */
export function formatDuration(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

/** Minutes from midnight for a date, in the given IANA timezone. */
export function minutesInTimezone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

/** The tenant-local calendar date (YYYY-MM-DD) for a moment in time. */
export function workDateInTimezone(date: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).format(date);
  return new Date(`${parts}T00:00:00.000Z`);
}

/** "9:42 AM" in the tenant's timezone — confirmation copy. */
export function formatClockTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(date);
}

/** "Fri, 7 Aug 2026" — never MM/DD (implementation guide §8). */
export function formatLongDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(date);
}

/** "09:30" from minutes-from-midnight. */
export function formatShiftTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
