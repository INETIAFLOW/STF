import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Tasks" };

/** My tasks shell (screen E12). Server-guarded by the Tasks module flag. */
export default async function EmployeeTasksPage() {
  const { decision } = await checkAccess({ module: "TASKS" });
  if (!decision.allowed) redirect("/unauthorized");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="mt-2 font-heading text-h1 text-text-primary">My tasks</h1>
      <Card flush>
        <EmptyState
          warm
          title="Your tasks will appear here."
          body="When your manager assigns work, you'll get a notification."
        />
      </Card>
    </div>
  );
}
