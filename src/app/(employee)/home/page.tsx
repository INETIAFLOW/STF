import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/authz/guard";
import { loadEntitlements } from "@/lib/authz/entitlements";
import { evaluateAccess } from "@/lib/authz/flags";
import { loadAttendanceContext } from "@/lib/attendance/service";
import { getDb } from "@/lib/db";
import { devFixtureOffline } from "@/lib/auth/fixture";
import { AttendanceActionCard } from "@/components/attendance/AttendanceActionCard";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TaskCard } from "@/components/tasks/TaskCard";

export const metadata: Metadata = { title: "Home" };

/** Time-of-day greeting in the tenant's timezone (copy-deck.md §5). */
function greeting(timezone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Employee home (screen E3): attendance action + today's tasks. */
export default async function EmployeeHomePage() {
  const session = await requireSession();
  const firstName = session.user.displayName.split(/\s+/)[0];
  const entitlements = await loadEntitlements(
    session.tenant.id,
    session.user.id,
  );

  const attendanceOn = evaluateAccess({
    session,
    entitlements,
    module: "ATTENDANCE",
  }).allowed;
  const tasksOn = evaluateAccess({
    session,
    entitlements,
    module: "TASKS",
  }).allowed;

  const attendance = attendanceOn
    ? await loadAttendanceContext(session)
    : null;

  const tasks =
    tasksOn && !devFixtureOffline()
      ? await getDb().task.findMany({
          where: {
            tenantId: session.tenant.id,
            assigneeId: session.membership.id,
            status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
          },
          orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
          take: 3,
        })
      : [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="mt-2 font-heading text-h1 text-text-primary">
        {greeting(session.tenant.timezone)}, {firstName}
      </h1>

      {attendance && (
        <section aria-label="Attendance today">
          <AttendanceActionCard context={attendance} firstName={firstName} />
        </section>
      )}

      {tasksOn && (
        <section aria-labelledby="today-tasks">
          <div className="mb-2 flex items-baseline justify-between">
            <h2
              id="today-tasks"
              className="font-heading text-h2 text-text-primary"
            >
              Today&apos;s tasks
            </h2>
            {tasks.length > 0 && (
              <Link
                href="/tasks"
                className="text-label text-brand-primary underline-offset-2 hover:underline"
              >
                View all
              </Link>
            )}
          </div>

          {tasks.length === 0 ? (
            <Card flush>
              <EmptyState
                warm
                title="No tasks today."
                body="New tasks from your manager will appear here."
              />
            </Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {tasks.map((task) => (
                <li key={task.id}>
                  <TaskCard
                    task={{
                      id: task.id,
                      title: task.title,
                      priority: task.priority,
                      status: task.status,
                      dueDate: task.dueDate,
                      proofRequirement: task.proofRequirement,
                    }}
                    timezone={session.tenant.timezone}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
