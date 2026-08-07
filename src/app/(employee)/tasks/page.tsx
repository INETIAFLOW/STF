import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { getDb } from "@/lib/db";
import { devFixtureOffline } from "@/lib/auth/fixture";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TaskCard } from "@/components/tasks/TaskCard";

export const metadata: Metadata = { title: "Tasks" };

/** My tasks (screen E12). Open work first, then completed. */
export default async function EmployeeTasksPage() {
  const { session, decision } = await checkAccess({ module: "TASKS" });
  if (!decision.allowed) redirect("/unauthorized");

  const tasks = devFixtureOffline()
    ? []
    : await getDb().task.findMany({
        where: {
          tenantId: session.tenant.id,
          assigneeId: session.membership.id,
        },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
        take: 50,
      });

  const open = tasks.filter((t) => t.status !== "COMPLETED");
  const done = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <div className="flex flex-col gap-5">
      <h1 className="mt-2 font-heading text-h1 text-text-primary">My tasks</h1>

      {tasks.length === 0 ? (
        <Card flush>
          <EmptyState
            warm
            title="No tasks today."
            body="New tasks from your manager will appear here."
          />
        </Card>
      ) : (
        <>
          <section aria-labelledby="open-tasks">
            <h2
              id="open-tasks"
              className="mb-3 font-heading text-h2 text-text-primary"
            >
              Open ({open.length})
            </h2>
            {open.length === 0 ? (
              <Card flush>
                <EmptyState
                  warm
                  title="Nothing open."
                  body="Everything assigned to you is done or in review."
                />
              </Card>
            ) : (
              <ul className="flex flex-col gap-3">
                {open.map((task) => (
                  <li key={task.id}>
                    <TaskCard
                      task={task}
                      timezone={session.tenant.timezone}
                      href={`/tasks/${task.id}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {done.length > 0 && (
            <section aria-labelledby="done-tasks">
              <h2
                id="done-tasks"
                className="mb-3 font-heading text-h2 text-text-primary"
              >
                Done ({done.length})
              </h2>
              <ul className="flex flex-col gap-3">
                {done.map((task) => (
                  <li key={task.id}>
                    <TaskCard
                      task={task}
                      timezone={session.tenant.timezone}
                      href={`/tasks/${task.id}`}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
