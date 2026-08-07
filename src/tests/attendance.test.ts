import { describe, expect, it } from "vitest";
import {
  MAX_ACCURACY_M,
  assessLocation,
  checkInButtonLabel,
  checkInConsequence,
  distanceMetres,
  formatDistance,
  formatDuration,
  lateMinutes,
  minutesInTimezone,
  workDateInTimezone,
} from "@/lib/attendance/policy";

const BRANCH = {
  name: "Shivaji Market",
  lat: 19.076,
  lng: 72.8777,
  radiusM: 300,
};

const SHIFT = { startMinutes: 9 * 60 + 30, endMinutes: 18 * 60 + 30, graceMinutes: 10 };

describe("late calculation", () => {
  it("is not late before the shift starts", () => {
    expect(lateMinutes(9 * 60 + 15, SHIFT)).toBe(0);
  });

  it("is not late exactly at the grace boundary (grace is inclusive)", () => {
    // edge-cases.md: "at exactly 10 minutes the employee is NOT late"
    expect(lateMinutes(9 * 60 + 40, SHIFT)).toBe(0);
  });

  it("is late one minute past the grace boundary", () => {
    expect(lateMinutes(9 * 60 + 41, SHIFT)).toBe(11);
  });

  it("reports the full minutes late, not minutes past grace", () => {
    expect(lateMinutes(9 * 60 + 42, SHIFT)).toBe(12);
  });
});

describe("location assessment", () => {
  it("omits location entirely when policy does not require it", () => {
    const result = assessLocation({
      locationRequired: false,
      branch: BRANCH,
      coords: { lat: 0, lng: 0 },
    });
    expect(result.outcome).toBe("NOT_REQUIRED");
    expect(result.label).toBe("");
  });

  it("is INSIDE within the permitted radius", () => {
    const result = assessLocation({
      locationRequired: true,
      branch: BRANCH,
      coords: { lat: 19.0761, lng: 72.8778, accuracyM: 20 },
    });
    expect(result.outcome).toBe("INSIDE");
    expect(result.label).toContain("Inside Shivaji Market area");
  });

  it("is OUTSIDE beyond the radius and reports the distance", () => {
    const result = assessLocation({
      locationRequired: true,
      branch: BRANCH,
      coords: { lat: 19.09, lng: 72.8777, accuracyM: 20 },
    });
    expect(result.outcome).toBe("OUTSIDE");
    expect(result.distanceM).toBeGreaterThan(300);
  });

  it("treats poor GPS accuracy as unconfirmed, not a silent pass", () => {
    const result = assessLocation({
      locationRequired: true,
      branch: BRANCH,
      coords: { lat: 19.0761, lng: 72.8778, accuracyM: MAX_ACCURACY_M + 1 },
    });
    expect(result.outcome).toBe("UNCONFIRMED");
  });

  it("is unconfirmed when location is unavailable", () => {
    const result = assessLocation({
      locationRequired: true,
      branch: BRANCH,
      coords: null,
    });
    expect(result.outcome).toBe("UNCONFIRMED");
  });

  it("measures distance sanely", () => {
    const oneDegreeLat = distanceMetres(
      { lat: 0, lng: 0 },
      { lat: 1, lng: 0 },
    );
    expect(oneDegreeLat).toBeGreaterThan(110_000);
    expect(oneDegreeLat).toBeLessThan(112_000);
  });
});

describe("consequence contract", () => {
  it("returns null when there is nothing to warn about", () => {
    const consequence = checkInConsequence({
      location: { outcome: "INSIDE", distanceM: 10, label: "Inside" },
      lateBy: 0,
    });
    expect(consequence).toBeNull();
  });

  it("states exact late minutes before the action", () => {
    const consequence = checkInConsequence({
      location: { outcome: "INSIDE", distanceM: 10, label: "Inside" },
      lateBy: 12,
    });
    expect(consequence?.sentence).toBe(
      "Checking in now will record a late arrival of 12 minutes.",
    );
    expect(consequence?.requiresReason).toBe(false);
  });

  it("requires a reason outside the permitted area and names the distance", () => {
    const consequence = checkInConsequence({
      location: { outcome: "OUTSIDE", distanceM: 1400, label: "Outside" },
      lateBy: 0,
      branchName: "Shivaji Market",
    });
    expect(consequence?.sentence).toBe(
      "You are 1.4 km outside the Shivaji Market area.",
    );
    expect(consequence?.requiresReason).toBe(true);
    expect(consequence?.detail).toContain("sent to your manager for approval");
  });

  it("requires a reason when location cannot be confirmed", () => {
    const consequence = checkInConsequence({
      location: { outcome: "UNCONFIRMED", distanceM: null, label: "" },
      lateBy: 0,
    });
    expect(consequence?.requiresReason).toBe(true);
  });

  it("changes the button label when approval is needed", () => {
    expect(checkInButtonLabel(null)).toBe("Check In");
    expect(
      checkInButtonLabel({ sentence: "x", requiresReason: true }),
    ).toBe("Check In — needs approval");
    expect(
      checkInButtonLabel({ sentence: "x", requiresReason: false }),
    ).toBe("Check In");
  });
});

describe("formatting", () => {
  it("formats distances the way the copy deck does", () => {
    expect(formatDistance(1400)).toBe("1.4 km");
    expect(formatDistance(320)).toBe("320 m");
  });

  it("formats durations as h:mm", () => {
    expect(formatDuration(126)).toBe("2:06");
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(-5)).toBe("0:00");
  });

  it("resolves tenant-local minutes and work date", () => {
    // 2026-08-07T04:12:00Z is 09:42 IST on the 7th.
    const moment = new Date("2026-08-07T04:12:00.000Z");
    expect(minutesInTimezone(moment, "Asia/Kolkata")).toBe(9 * 60 + 42);
    expect(workDateInTimezone(moment, "Asia/Kolkata").toISOString()).toBe(
      "2026-08-07T00:00:00.000Z",
    );
  });

  it("keeps the work date on the local day across the UTC boundary", () => {
    // 2026-08-07T20:00:00Z is 01:30 IST on the 8th.
    const moment = new Date("2026-08-07T20:00:00.000Z");
    expect(workDateInTimezone(moment, "Asia/Kolkata").toISOString()).toBe(
      "2026-08-08T00:00:00.000Z",
    );
  });
});
