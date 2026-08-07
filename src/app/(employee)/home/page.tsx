import type { Metadata } from "next";
import { requireSession } from "@/lib/authz/guard";
import { STATUS } from "@/lib/status";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";

export const metadata: Metadata = { title: "Home" };

/** Time-of-day greeting in the tenant's timezone (copy-deck.md §5). */
function greeting(timezone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Employee home shell (screen E3). Layout, navigation and components are
 * real; attendance/task data arrives with Phase 2 — placeholders are
 * labelled and disabled controls state their reason.
 */
export default async function EmployeeHomePage() {
  const session = await requireSession();
  const firstName = session.user.displayName.split(/\s+/)[0];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="mt-2 font-heading text-h1 text-text-primary">
        {greeting(session.tenant.timezone)}, {firstName}
      </h1>

      <Card>
        <CardHeader
          title="Attendance today"
          meta="Check-in opens in the next build phase."
        />
        <div className="flex flex-col gap-4">
          <StatusChip status={STATUS.notRecorded} size="lg" />
          <Button
            size="xl"
            disabled
            disabledReason="Attendance actions arrive with the next build phase."
          >
            Check In
          </Button>
        </div>
      </Card>

      <section aria-labelledby="today-tasks">
        <h2
          id="today-tasks"
          className="mb-2 font-heading text-h2 text-text-primary"
        >
          Today&apos;s tasks
        </h2>
        <Card flush>
          <EmptyState
            warm
            title="No tasks today."
            body="New tasks from your manager will appear here."
          />
        </Card>
      </section>

      <Alert variant="info" title="Early build">
        This is the Phase 1 shell. Attendance, tasks and leave open here once
        their modules are built and approved.
      </Alert>
    </div>
  );
}
