import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlannedScreen } from "../_components/PlannedScreen";

export const metadata: Metadata = { title: "Daily report" };

export default async function AdminDailyReportPage() {
  const { decision } = await checkAccess({
    module: "DAILY_REPORTING",
    permission: "reports.view",
  });
  if (!decision.allowed) redirect("/unauthorized");

  return (
    <PlannedScreen title="Daily report" phase="Phase 2 — Daily Operations">
      <EmptyState
        title="No summaries yet."
        body="Daily summaries are sent on your configured schedule once attendance and tasks are live."
      />
    </PlannedScreen>
  );
}
