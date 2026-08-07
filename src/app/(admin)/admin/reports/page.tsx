import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlannedScreen } from "../_components/PlannedScreen";

export const metadata: Metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  const { decision } = await checkAccess({
    module: "EMPLOYEES",
    permission: "reports.view",
  });
  if (!decision.allowed) redirect("/unauthorized");

  return (
    <PlannedScreen title="Reports" phase="Phase 3 — Payroll and Reporting">
      <EmptyState
        title="No reports yet."
        body="Operational reports and exports arrive with the reporting module. Exports are recorded in the activity log."
      />
    </PlannedScreen>
  );
}
