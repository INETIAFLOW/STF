import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlannedScreen } from "../_components/PlannedScreen";

export const metadata: Metadata = { title: "Leave" };

export default async function AdminLeavePage() {
  const { decision } = await checkAccess({
    module: "LEAVE",
    permission: "leave.view",
  });
  if (!decision.allowed) redirect("/unauthorized");

  return (
    <PlannedScreen title="Leave" phase="Phase 2 — Daily Operations">
      <EmptyState
        title="No leave to approve."
        body="New requests appear here as soon as they are sent."
      />
    </PlannedScreen>
  );
}
