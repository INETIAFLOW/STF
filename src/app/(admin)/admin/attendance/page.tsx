import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlannedScreen } from "../_components/PlannedScreen";

export const metadata: Metadata = { title: "Attendance" };

export default async function AdminAttendancePage() {
  const { decision } = await checkAccess({
    module: "ATTENDANCE",
    permission: "attendance.view",
  });
  if (!decision.allowed) redirect("/unauthorized");

  return (
    <PlannedScreen title="Attendance" phase="Phase 2 — Daily Operations">
      <EmptyState
        title="No exceptions to review."
        body="Attendance for today is clear."
      />
    </PlannedScreen>
  );
}
