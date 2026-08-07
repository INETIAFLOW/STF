import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { getDb } from "@/lib/db";
import { devFixtureOffline } from "@/lib/auth/fixture";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { STATUS, statusLate, type Status } from "@/lib/status";
import {
  formatClockTime,
  formatDistance,
  formatDuration,
  workDateInTimezone,
} from "@/lib/attendance/policy";
import { ExceptionQueue } from "./ExceptionQueue";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Attendance" };

/**
 * Attendance dashboard + exceptions review (screens A2/A3).
 * Metrics are real counts for today; exceptions use the Approval card.
 */
export default async function AdminAttendancePage() {
  const { session, decision } = await checkAccess({
    module: "ATTENDANCE",
    permission: "attendance.view",
  });
  if (!decision.allowed) redirect("/unauthorized");

  const tz = session.tenant.timezone;
  const canReview = session.permissions.has("attendance.review");
  const workDate = workDateInTimezone(new Date(), tz);

  const [records, exceptions, headcount] = devFixtureOffline()
    ? [[], [], 0]
    : await Promise.all([
        getDb().attendanceRecord.findMany({
          where: { tenantId: session.tenant.id, workDate },
          include: { membership: { include: { user: true } } },
          orderBy: { checkInAt: "asc" },
        }),
        getDb().attendanceRecord.findMany({
          where: { tenantId: session.tenant.id, reviewStatus: "PENDING" },
          include: { membership: { include: { user: true } }, branch: true },
          orderBy: { checkInAt: "asc" },
          take: 25,
        }),
        getDb().tenantMembership.count({
          where: { tenantId: session.tenant.id, status: "ACTIVE" },
        }),
      ]);

  const present = records.filter((r) => r.checkInAt).length;
  const late = records.filter((r) => r.lateMinutes > 0).length;
  const pending = records.filter((r) => r.reviewStatus === "PENDING").length;
  const notRecorded = Math.max(0, headcount - present);

  const metrics = [
    { label: "Present", value: present, dot: "bg-status-success-fg" },
    { label: "Late", value: late, dot: "bg-status-warning-fg" },
    { label: "Not recorded", value: notRecorded, dot: "bg-status-neutral-fg" },
    { label: "Needs review", value: pending, dot: "bg-status-warning-fg" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-h1 text-text-primary">Attendance</h1>

      <section aria-label="Attendance today">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label}>
              <p className="flex items-center gap-2 text-label text-text-secondary">
                <span
                  aria-hidden="true"
                  className={cn("size-1.5 rounded-pill", metric.dot)}
                />
                {metric.label}
              </p>
              <p className="mt-1 font-mono text-data-lg font-semibold text-text-primary tabular-nums">
                {metric.value}
              </p>
              <p className="text-caption text-text-tertiary">
                of {headcount} employees
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="exceptions">
        <h2 id="exceptions" className="mb-1 font-heading text-h2 text-text-primary">
          Review exceptions ({exceptions.length})
        </h2>
        <p className="mb-3 max-w-[72ch] text-secondary text-text-secondary">
          Delivery and field staff often work away from a branch. Exceptions
          are normal — they are a record to confirm, not a fault to punish.
        </p>

        {exceptions.length === 0 ? (
          <Card flush>
            <EmptyState
              title="No exceptions to review."
              body="Attendance for today is clear."
            />
          </Card>
        ) : !canReview ? (
          <Alert variant="info" title="You can see exceptions but not decide them.">
            Ask your company owner for the attendance review permission.
          </Alert>
        ) : (
          <ExceptionQueue
            items={exceptions.map((record) => ({
              id: record.id,
              name: record.membership.user.displayName,
              meta: record.membership.employeeCode ?? undefined,
              checkInTime: record.checkInAt
                ? formatClockTime(record.checkInAt, tz)
                : "—",
              distanceLabel:
                record.checkInDistanceM != null
                  ? formatDistance(record.checkInDistanceM)
                  : null,
              branchName: record.branch?.name ?? null,
              outcome: record.checkInOutcome,
              reason: record.checkInReason,
              lateMinutes: record.lateMinutes,
            }))}
          />
        )}
      </section>

      <section aria-labelledby="today-list">
        <h2 id="today-list" className="mb-3 font-heading text-h2 text-text-primary">
          Today
        </h2>
        {records.length === 0 ? (
          <Card flush>
            <EmptyState
              title="No attendance recorded yet."
              body="Records appear here as employees check in."
            />
          </Card>
        ) : (
          <>
            {/* Mobile: stacked cards (a scrolling table is not acceptable). */}
            <ul className="flex flex-col gap-3 md:hidden">
              {records.map((record) => {
                const statuses: Status[] = [];
                if (record.lateMinutes > 0)
                  statuses.push(statusLate(record.lateMinutes));
                else if (record.checkInAt) statuses.push(STATUS.present);
                if (record.reviewStatus === "PENDING")
                  statuses.push(STATUS.pendingReview);
                const worked =
                  record.checkInAt && record.checkOutAt
                    ? (record.checkOutAt.getTime() -
                        record.checkInAt.getTime()) /
                      60000
                    : null;
                return (
                  <li key={record.id}>
                    <Card>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-body font-semibold text-text-primary">
                          {record.membership.user.displayName}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {statuses.map((s) => (
                            <StatusChip key={s.key} status={s} size="sm" />
                          ))}
                        </div>
                      </div>
                      <p className="mt-1 font-mono text-data text-text-secondary tabular-nums">
                        In{" "}
                        {record.checkInAt
                          ? formatClockTime(record.checkInAt, tz)
                          : "—"}{" "}
                        · Out{" "}
                        {record.checkOutAt
                          ? formatClockTime(record.checkOutAt, tz)
                          : "—"}{" "}
                        · {worked != null ? formatDuration(worked) : "—"}
                      </p>
                    </Card>
                  </li>
                );
              })}
            </ul>

            {/* md+: real table with row headers. */}
            <div className="hidden overflow-hidden rounded-surface-card border border-border-default bg-surface-default shadow-elevation-1 md:block">
              <table className="w-full border-collapse">
                <caption className="sr-only">
                  Attendance for today by employee
                </caption>
                <thead>
                  <tr className="bg-surface-sunken">
                    <th scope="col" className="micro-label px-4 py-2.5 text-left text-text-tertiary">
                      Employee
                    </th>
                    <th scope="col" className="micro-label px-4 py-2.5 text-right text-text-tertiary">
                      In
                    </th>
                    <th scope="col" className="micro-label px-4 py-2.5 text-right text-text-tertiary">
                      Out
                    </th>
                    <th scope="col" className="micro-label px-4 py-2.5 text-right text-text-tertiary">
                      Hours
                    </th>
                    <th scope="col" className="micro-label px-4 py-2.5 text-left text-text-tertiary">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const worked =
                      record.checkInAt && record.checkOutAt
                        ? (record.checkOutAt.getTime() -
                            record.checkInAt.getTime()) /
                          60000
                        : null;
                    const status =
                      record.reviewStatus === "PENDING"
                        ? STATUS.pendingReview
                        : record.lateMinutes > 0
                          ? statusLate(record.lateMinutes)
                          : STATUS.present;
                    return (
                      <tr
                        key={record.id}
                        className="border-t border-border-subtle hover:bg-surface-sunken"
                      >
                        <th
                          scope="row"
                          className="px-4 py-2.5 text-left text-body font-semibold text-text-primary"
                        >
                          {record.membership.user.displayName}
                        </th>
                        <td className="px-4 py-2.5 text-right font-mono text-data tabular-nums">
                          {record.checkInAt
                            ? formatClockTime(record.checkInAt, tz)
                            : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-data tabular-nums">
                          {record.checkOutAt
                            ? formatClockTime(record.checkOutAt, tz)
                            : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-data tabular-nums">
                          {worked != null ? formatDuration(worked) : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusChip status={status} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
