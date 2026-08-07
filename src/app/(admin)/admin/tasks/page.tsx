import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlannedScreen } from "../_components/PlannedScreen";

export const metadata: Metadata = { title: "Tasks" };

export default async function AdminTasksPage() {
  const { decision } = await checkAccess({
    module: "TASKS",
    permission: "tasks.view",
  });
  if (!decision.allowed) redirect("/unauthorized");

  return (
    <PlannedScreen title="Tasks" phase="Phase 2 — Daily Operations">
      <EmptyState
        title="No tasks yet."
        body="Assign the first task to see it here."
        action={
          <Button
            disabled
            disabledReason="Task creation opens in Phase 2."
          >
            New task
          </Button>
        }
      />
    </PlannedScreen>
  );
}
