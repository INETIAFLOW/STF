import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlannedScreen } from "../_components/PlannedScreen";

export const metadata: Metadata = { title: "Payroll" };

/** Payroll shell — gated on the sensitive payroll.view permission. */
export default async function AdminPayrollPage() {
  const { decision } = await checkAccess({
    module: "PAYROLL",
    permission: "payroll.view",
  });
  if (!decision.allowed) redirect("/unauthorized");

  return (
    <PlannedScreen title="Payroll" phase="Phase 3 — Payroll and Reporting">
      <EmptyState
        title="No payroll for this month yet."
        body="Payroll can be calculated once attendance is recorded for the period."
        action={
          <Button
            disabled
            disabledReason="Payroll runs open in Phase 3, after attendance exists and rules are approved."
          >
            Calculate
          </Button>
        }
      />
    </PlannedScreen>
  );
}
