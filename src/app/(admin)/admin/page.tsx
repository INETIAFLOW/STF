import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminArea } from "@/lib/authz/guard";
import { loadEntitlements } from "@/lib/authz/entitlements";
import { evaluateAccess } from "@/lib/authz/flags";
import { getDb } from "@/lib/db";
import { devFixtureOffline } from "@/lib/auth/fixture";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { STATUS } from "@/lib/status";
import { workDateInTimezone } from "@/lib/attendance/policy";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Admin dashboard (screen A1) — real counts from the tenant's data.
 * Metrics never render a partial number: they are computed server-side
 * before the page streams.
 */
export default async function AdminDashboardPage() {
  const session = await requireAdminArea();
  const entitlements = await loadEntitlements(
    session.tenant.id,
    session.user.id,
  );
  const tz = session.tenant.timezone;

  const attendanceOn = evaluateAccess({
    session,
    entitlements,
    module: "ATTENDANCE",
  }).allowed;
  const leaveOn = evaluateAccess({ session, entitlements, module: "LEAVE" }).allowed;
  const tasksOn = evaluateAccess({ session, entitlements, module: "TASKS" }).allowed;

  const workDate = workDateInTimezone(new Date(), tz);
  const db = devFixtureOffline() ? null : getDb();

  const [headcount, records, pendingExceptions, pendingLeave, openTasks, proofToReview, activity] =
    db
      ? await Promise.all([
          db.tenantMembership.count({
            where: { tenantId: session.tenant.id, status: "ACTIVE" },
          }),
          attendanceOn
            ? db.attendanceRecord.findMany({
                where: { tenantId: session.tenant.id, workDate },
                select: { checkInAt: true, lateMinutes: true, reviewStatus: true },
              })
            : [],
          attendanceOn
            ? db.attendanceRecord.count({
                where: { tenantId: session.tenant.id, reviewStatus: "PENDING" },
              })
            : 0,
          leaveOn
            ? db.leaveRequest.count({
                where: { tenantId: session.tenant.id, status: "PENDING" },
              })
            : 0,
          tasksOn
            ? db.task.count({
                where: {
                  tenantId: session.tenant.id,
                  status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
                },
              })
            : 0,
          tasksOn
            ? db.task.count({
                where: {
                  tenantId: session.tenant.id,
                  status: "SUBMITTED_FOR_REVIEW",
                },
              })
            : 0,
          db.auditEvent.findMany({
            where: { tenantId: session.tenant.id },
            orderBy: { createdAt: "desc" },
            take: 6,
            include: { actor: true },
          }),
        ])
      : [0, [], 0, 0, 0, 0, []];

  const present = records.filter((r) => r.checkInAt).length;
  const late = records.filter((r) => r.lateMinutes > 0).length;
  const notRecorded = Math.max(0, headcount - present);

  const metrics = attendanceOn
    ? [
        { label: "Present", value: present, dot: "bg-status-success-fg" },
        { label: "Late", value: late, dot: "bg-status-warning-fg" },
        { label: "Not recorded", value: notRecorded, dot: "bg-status-neutral-fg" },
        { label: "Needs review", value: pendingExceptions, dot: "bg-status-warning-fg" },
      ]
    : [];

  const reviewItems = [
    attendanceOn && {
      label: "Attendance exceptions",
      count: pendingExceptions,
      href: "/admin/attendance",
    },
    leaveOn && { label: "Leave requests", count: pendingLeave, href: "/admin/leave" },
    tasksOn && { label: "Task proof", count: proofToReview, href: "/admin/tasks" },
  ].filter(Boolean) as Array<{ label: string; count: number; href: string }>;

  const totalToReview = reviewItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-h1 text-text-primary">Dashboard</h1>

      {attendanceOn && (
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
      )}

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card flush>
          <div className="p-5 pb-0">
            <CardHeader title="Needs your review" />
          </div>
          {totalToReview === 0 ? (
            <EmptyState
              title="No exceptions to review."
              body="Attendance for today is clear."
            />
          ) : (
            <ul className="flex flex-col p-5 pt-0">
              {reviewItems
                .filter((item) => item.count > 0)
                .map((item) => (
                  <li
                    key={item.href}
                    className="flex items-center justify-between gap-3 border-b border-border-subtle py-3 last:border-0"
                  >
                    <Link
                      href={item.href}
                      className="text-body font-medium text-brand-primary underline-offset-2 hover:underline"
                    >
                      {item.label}
                    </Link>
                    <span className="font-mono text-data font-semibold text-text-primary tabular-nums">
                      {item.count}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-5">
          {tasksOn && (
            <Card>
              <CardHeader title="Open tasks" />
              <p className="font-mono text-data-lg font-semibold text-text-primary tabular-nums">
                {openTasks}
              </p>
              <p className="text-caption text-text-secondary">
                Not started or in progress
              </p>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Payroll"
              action={<StatusChip status={STATUS.notReady} size="sm" />}
            />
            <p className="text-secondary text-text-secondary">
              Payroll runs open in a later phase, once its rules are approved
              and reviewed. Attendance and leave inputs are being recorded
              now.
            </p>
          </Card>

          <Card flush>
            <div className="p-5 pb-0">
              <CardHeader title="Recent activity" />
            </div>
            {activity.length === 0 ? (
              <EmptyState
                title="No activity yet."
                body="Configuration and approval events will appear here."
              />
            ) : (
              <ul className="flex flex-col p-5 pt-0">
                {activity.map((event) => (
                  <li
                    key={event.id}
                    className="border-b border-border-subtle py-2.5 last:border-0"
                  >
                    <p className="text-secondary text-text-primary">
                      {event.action}
                    </p>
                    <p className="font-mono text-mono text-text-tertiary uppercase">
                      {event.actor?.displayName ?? "System"} ·{" "}
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                        timeZone: tz,
                      }).format(event.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
