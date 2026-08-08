"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CloudOff, LogIn, LogOut, MapPinOff, TriangleAlert } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { TextArea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Loading";
import { useToast } from "@/components/ui/Toast";
import { STATUS, statusLate, type Status } from "@/lib/status";
import { cn } from "@/lib/cn";
import {
  checkInButtonLabel,
  computeCheckInState,
  formatDuration,
  formatShiftTime,
  type AttendanceContext,
} from "@/lib/attendance/policy";
import { checkInAction, checkOutAction } from "@/lib/attendance/actions";

/**
 * Attendance action card (component-specifications.md §26) — the signature
 * employee component.
 *
 * Anatomy: live clock → date → location status as TEXT → consequence
 * banner → one full-width 56px action in the thumb zone → shift line →
 * hours. After acting it becomes a warm confirmation (the single warm
 * element on this screen).
 *
 * Rules honoured here:
 * - The consequence is shown BEFORE the tap and is part of the button's
 *   accessible name.
 * - Location status is never an icon alone.
 * - The button is never tappable while its consequence is unknown — the
 *   chip and action show skeletons until location resolves.
 * - The recorded time comes back from the server and is displayed.
 */

interface Props {
  context: AttendanceContext;
  firstName: string;
}

type GeoState =
  | { phase: "resolving" }
  | { phase: "ready"; coords: { lat: number; lng: number; accuracyM: number | null } }
  | { phase: "denied" }
  | { phase: "not-required" };

export function AttendanceActionCard({ context, firstName }: Props) {
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState<Date | null>(null);
  const [geo, setGeo] = useState<GeoState>(
    context.locationRequired ? { phase: "resolving" } : { phase: "not-required" },
  );
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState<{
    message: string;
    detail?: string;
  } | null>(null);
  const [today, setToday] = useState(context.today);
  const [online, setOnline] = useState(true);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  // Live clock: ticks every second, but is NOT announced (aria-live off).
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    const raf = requestAnimationFrame(() => setNow(new Date()));
    return () => {
      clearInterval(id);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    const sync = requestAnimationFrame(() => setOnline(navigator.onLine));
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      cancelAnimationFrame(sync);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Location is requested at tap time in the real flow; we resolve once on
  // mount so the consequence can be shown before the tap, as the spec
  // requires. The permission prompt is the browser's.
  useEffect(() => {
    if (!context.locationRequired) return;
    let cancelled = false;
    const request = requestAnimationFrame(() => {
      if (!("geolocation" in navigator)) {
        setGeo({ phase: "denied" });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return;
          setGeo({
            phase: "ready",
            coords: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracyM: position.coords.accuracy ?? null,
            },
          });
        },
        () => {
          if (!cancelled) setGeo({ phase: "denied" });
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
      );
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(request);
    };
  }, [context.locationRequired]);

  const checkedIn = Boolean(today?.checkInAt);
  const checkedOut = Boolean(today?.checkOutAt);

  const coords = geo.phase === "ready" ? geo.coords : null;

  // The SAME function the server action runs, so the sentence shown before
  // the tap is by construction the sentence that gets recorded (D-011).
  const state =
    geo.phase === "resolving" || !now
      ? null
      : computeCheckInState(context, coords, now);

  const location = state?.location ?? null;
  const lateBy = state?.lateBy ?? 0;
  const consequence = state && !checkedIn ? state.consequence : null;

  const reasonMissing = Boolean(consequence?.requiresReason) && !reason.trim();

  const locationStatus: Status | null = !location
    ? null
    : location.outcome === "INSIDE"
      ? { key: "inside", label: location.label, tone: "success" }
      : location.outcome === "OUTSIDE"
        ? { key: "outside", label: location.label, tone: "warning" }
        : location.outcome === "UNCONFIRMED"
          ? { key: "location-off", label: location.label, tone: "info" }
          : null; // NOT_REQUIRED: chip omitted entirely, no placeholder

  function handleCheckIn() {
    if (reasonMissing) {
      reasonRef.current?.focus();
      return;
    }
    startTransition(async () => {
      const result = await checkInAction({
        coords,
        reason: reason.trim() || undefined,
      });
      if (result.ok) {
        setConfirmation({ message: result.message, detail: result.detail });
        setToday((prev) => ({
          recordId: prev?.recordId ?? null,
          checkInAt: new Date(),
          checkOutAt: null,
          lateMinutes: lateBy,
          reviewStatus: consequence?.requiresReason ? "PENDING" : "NONE",
          exemptionStatus: "NONE",
          checkInOutcome: location?.outcome ?? null,
          checkInDistanceM: location?.distanceM ?? null,
          offlineCaptured: false,
        }));
        setReason("");
      } else {
        show({ variant: "error", message: result.error });
      }
    });
  }

  function handleCheckOut() {
    startTransition(async () => {
      const result = await checkOutAction({ coords });
      if (result.ok) {
        setConfirmation({ message: result.message, detail: result.detail });
        setToday((prev) =>
          prev ? { ...prev, checkOutAt: new Date() } : prev,
        );
      } else {
        show({ variant: "error", message: result.error });
      }
    });
  }

  const elapsedMinutes =
    today?.checkInAt && now
      ? (Math.min(now.getTime(), today.checkOutAt?.getTime() ?? now.getTime()) -
          new Date(today.checkInAt).getTime()) /
        60000
      : 0;

  // Warm confirmation panel — the one warm element on this screen.
  if (confirmation) {
    return (
      <div
        className={cn(
          "rounded-surface-card border border-warm-border bg-warm-subtle p-5",
          "motion-safe:animate-[stf-confirm-pulse_var(--stf-motion-duration-slow)_var(--stf-motion-easing-spring-subtle)]",
        )}
      >
        <p role="status" className="text-h2 font-heading text-warm-text">
          {confirmation.message}
        </p>
        {confirmation.detail && (
          <p className="mt-1 text-body text-warm-text">{confirmation.detail}</p>
        )}
        {!online && (
          <p className="mt-3 inline-flex items-center gap-2">
            <StatusChip status={STATUS.waitingToSend} size="sm" />
          </p>
        )}
        {checkedIn && !checkedOut && (
          <div className="mt-4 border-t border-warm-border pt-4">
            <p className="text-secondary text-warm-text">
              Working now · {formatDuration(elapsedMinutes)}
            </p>
            <Button
              size="xl"
              className="mt-3"
              loading={pending}
              onClick={handleCheckOut}
              leadingIcon={<LogOut aria-hidden="true" className="size-5" />}
            >
              Check Out
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-surface-card border border-border-default bg-surface-default p-5 shadow-elevation-2">
      {/* Live clock — deliberately not a live region. */}
      <p
        aria-live="off"
        className="font-mono text-data-xl font-semibold text-text-primary tabular-nums"
      >
        {now
          ? new Intl.DateTimeFormat("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
              timeZone: context.timezone,
            }).format(now)
          : "--:--:--"}
      </p>
      <p className="mt-0.5 text-secondary text-text-secondary">
        {now
          ? new Intl.DateTimeFormat("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: context.timezone,
            }).format(now)
          : ""}
      </p>

      {/* Location status as text. Skeleton while unknown — never a
          tappable action whose consequence is unknown. */}
      {context.locationRequired && (
        <div className="mt-4">
          {locationStatus ? (
            <StatusChip status={locationStatus} size="lg" />
          ) : (
            <Skeleton className="h-8 w-56 rounded-chip" />
          )}
        </div>
      )}

      {/* A missing work location is a configuration gap, not "no location
          needed" — say so rather than silently skipping the area check. */}
      {context.branchMissing && (
        <div className="mt-3">
          <Alert variant="warning" title="Your work location isn't set.">
            Ask your manager to set it. You can still check in, and it will
            be sent for approval.
          </Alert>
        </div>
      )}

      {!online && (
        <div className="mt-3">
          <Alert variant="info" title="No internet — working offline">
            Your check-in is saved on this phone and will be sent when
            you&apos;re back online. Nothing is lost.
          </Alert>
        </div>
      )}

      {/* Consequence BEFORE the action. */}
      {consequence && (
        <div className="mt-4">
          <Alert
            variant="consequence"
            title={consequence.sentence}
            live={false}
          >
            {consequence.detail}
          </Alert>
        </div>
      )}

      {consequence?.requiresReason && (
        <div className="mt-3">
          <TextArea
            ref={reasonRef}
            label="Reason"
            required
            placeholder="Tell your manager why you are checking in from here"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="max-w-none"
          />
        </div>
      )}

      {/* Primary action: one per screen, full width, 56px, thumb zone. */}
      <div className="mt-4">
        {!checkedIn ? (
          location ? (
            <Button
              size="xl"
              loading={pending}
              onClick={handleCheckIn}
              disabled={reasonMissing}
              disabledReason={
                reasonMissing
                  ? "Add a reason to send this for approval."
                  : undefined
              }
              leadingIcon={<LogIn aria-hidden="true" className="size-5" />}
              aria-label={
                consequence
                  ? `${checkInButtonLabel(consequence)}. ${consequence.sentence}`
                  : lateBy > 0
                    ? `Check In, will record ${lateBy} minutes late`
                    : "Check In"
              }
            >
              {checkInButtonLabel(consequence)}
            </Button>
          ) : (
            <Skeleton className="h-14 w-full rounded-button-mobile-primary" />
          )
        ) : !checkedOut ? (
          <Button
            size="xl"
            loading={pending}
            onClick={handleCheckOut}
            leadingIcon={<LogOut aria-hidden="true" className="size-5" />}
          >
            Check Out
          </Button>
        ) : (
          <div className="rounded-md bg-surface-sunken p-4">
            <p className="text-body text-text-primary">
              Today is complete · {formatDuration(elapsedMinutes)} recorded
            </p>
          </div>
        )}
      </div>

      {/* Shift line + status of the existing record. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {context.shift && (
          <p className="text-caption text-text-secondary">
            Shift {formatShiftTime(context.shift.startMinutes)} –{" "}
            {formatShiftTime(context.shift.endMinutes)}
          </p>
        )}
        {checkedIn && today && (
          <>
            {today.lateMinutes > 0 && (
              <StatusChip status={statusLate(today.lateMinutes)} size="sm" />
            )}
            {today.reviewStatus === "PENDING" && (
              <StatusChip status={STATUS.pendingReview} size="sm" />
            )}
            {today.reviewStatus === "APPROVED" && (
              <StatusChip status={STATUS.approved} size="sm" />
            )}
          </>
        )}
      </div>

      {geo.phase === "denied" && (
        <p className="mt-3 inline-flex items-start gap-2 text-caption text-text-secondary">
          <MapPinOff aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Location is off. Turn on location to check in, or ask your manager
          to record it for you.
        </p>
      )}

      <p className="mt-4 border-t border-border-subtle pt-3 text-caption text-text-secondary">
        Your location is captured only when you check in or out, to confirm
        you were at a permitted place of work.
      </p>
    </div>
  );
}
