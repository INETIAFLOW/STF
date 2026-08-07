import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlannedScreen } from "../_components/PlannedScreen";

export const metadata: Metadata = { title: "Employees" };

export default async function AdminEmployeesPage() {
  const { decision } = await checkAccess({
    module: "EMPLOYEES",
    permission: "employees.view",
  });
  if (!decision.allowed) redirect("/unauthorized");

  return (
    <PlannedScreen title="Employees" phase="Phase 2 — Daily Operations">
      <EmptyState
        title="No employees yet."
        body="Employee profiles, documents and the directory arrive with the workforce module."
      />
    </PlannedScreen>
  );
}
