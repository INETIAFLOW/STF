import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Attendance" };

/** Attendance history shell (screen E9). Guarded by the Attendance module. */
export default async function EmployeeAttendancePage() {
  const { decision } = await checkAccess({ module: "ATTENDANCE" });
  if (!decision.allowed) redirect("/unauthorized");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="mt-2 font-heading text-h1 text-text-primary">
        Attendance
      </h1>
      <Card flush>
        <EmptyState
          warm
          title="No records yet."
          body="Your attendance will appear here after your first check-in."
        />
      </Card>
      <p className="text-caption text-text-secondary">
        Your location is captured only when you check in or out, to confirm
        you were at a permitted place of work.
      </p>
    </div>
  );
}
