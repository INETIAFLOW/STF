import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { getDb } from "@/lib/db";
import { devFixtureOffline } from "@/lib/auth/fixture";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { STATUS, statusLate, type Status } from "@/lib/status";
import { formatClockTime, formatDuration } from "@/lib/attendance/policy";

export const metadata: Metadata = { title: "Attendance" };

/** Attendance history (screen E9) — the employee's own records only. */
export default async function EmployeeAttendancePage() {
  const { session, decision } = await checkAccess({ module: "ATTENDANCE" });
  if (!decision.allowed) redirect("/unauthorized");

  const records = devFixtureOffline()
    ? []
    : await getDb().attendanceRecord.findMany({
        where: {
          tenantId: session.tenant.id,
          membershipId: session.membership.id,
        },
        orderBy: { workDate: "desc" },
        take: 30,
      });

  const tz = session.tenant.timezone;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="mt-2 font-heading text-h1 text-text-primary">
        Attendance
      </h1>

      {records.length === 0 ? (
        <Card flush>
          <EmptyState
            warm
            title="No records yet."
            body="Your attendance will appear here after your first check-in."
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {records.map((record) => {
            const statuses: Status[] = [];
            if (record.exemptionStatus === "EXEMPTED")
              statuses.push(STATUS.exempted);
            else if (record.lateMinutes > 0)
              statuses.push(statusLate(record.lateMinutes));
            if (record.reviewStatus === "PENDING")
              statuses.push(STATUS.pendingReview);
            if (record.reviewStatus === "APPROVED")
              statuses.push(STATUS.approved);
            if (record.reviewStatus === "REJECTED")
              statuses.push(STATUS.rejected);
            if (statuses.length === 0 && record.checkInAt)
              statuses.push(STATUS.present);
            if (record.checkInAt && !record.checkOutAt)
              statuses.push(STATUS.notRecorded);

            const worked =
              record.checkInAt && record.checkOutAt
                ? (record.checkOutAt.getTime() - record.checkInAt.getTime()) /
                  60000
                : null;

            return (
              <li key={record.id}>
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-label text-text-primary">
                      {new Intl.DateTimeFormat("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        timeZone: "UTC", // workDate is a date-only column
                      }).format(record.workDate)}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {statuses.map((status) => (
                        <StatusChip
                          key={status.key}
                          status={status}
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>

                  <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-data text-text-secondary tabular-nums">
                    <div className="flex gap-1.5">
                      <dt>In</dt>
                      <dd className="text-text-primary">
                        {record.checkInAt
                          ? formatClockTime(record.checkInAt, tz)
                          : "—"}
                      </dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt>Out</dt>
                      <dd className="text-text-primary">
                        {record.checkOutAt
                          ? formatClockTime(record.checkOutAt, tz)
                          : "—"}
                      </dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt>Hrs</dt>
                      <dd className="text-text-primary">
                        {worked != null ? formatDuration(worked) : "—"}
                      </dd>
                    </div>
                  </dl>

                  {record.checkInReason && (
                    <p className="mt-2 text-secondary text-text-secondary">
                      Your reason: {record.checkInReason}
                    </p>
                  )}
                  {record.reviewReason && (
                    <p className="mt-1 text-secondary text-text-secondary">
                      Manager&apos;s note: {record.reviewReason}
                    </p>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-caption text-text-secondary">
        Your location is captured only when you check in or out, to confirm
        you were at a permitted place of work.
      </p>
    </div>
  );
}
