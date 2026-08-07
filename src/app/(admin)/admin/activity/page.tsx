import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Activity log" };

/** Activity log shell — gated on the sensitive audit.view permission. */
export default async function AdminActivityPage() {
  const { decision } = await checkAccess({
    module: "EMPLOYEES",
    permission: "audit.view",
  });
  if (!decision.allowed) redirect("/unauthorized");

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-h1 text-text-primary">Activity log</h1>
      <Alert variant="info" title="Audit events are immutable">
        Audit events cannot be edited or deleted. Every entry keeps who
        acted, what changed, when, and the reason given.
      </Alert>
      <Card flush>
        <EmptyState
          title="No activity yet."
          body="Configuration changes, approvals and sensitive-data access will appear here."
        />
      </Card>
    </div>
  );
}
