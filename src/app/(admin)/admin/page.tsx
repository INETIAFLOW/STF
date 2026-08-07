import type { Metadata } from "next";
import { requireAdminArea } from "@/lib/authz/guard";
import { STATUS } from "@/lib/status";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Admin dashboard shell (screen A1). Metric values are illustrative until
 * the business modules ship — labelled loudly below; never presented as
 * live figures.
 */
const SAMPLE_METRICS = [
  { label: "Present", value: "42", dot: "bg-status-success-fg" },
  { label: "Late", value: "6", dot: "bg-status-warning-fg" },
  { label: "Absent", value: "3", dot: "bg-status-error-fg" },
  { label: "On Leave", value: "4", dot: "bg-status-info-fg" },
];

export default async function AdminDashboardPage() {
  await requireAdminArea();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-h1 text-text-primary">Dashboard</h1>

      <Alert variant="info" title="Sample data">
        The figures on this screen are illustrative placeholders. Live
        attendance, task and payroll data arrives with the business modules
        in the next build phases.
      </Alert>

      <section aria-label="Attendance today (sample)">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {SAMPLE_METRICS.map((metric) => (
            <Card key={metric.label}>
              <p className="flex items-center gap-2 text-label text-text-secondary">
                <span
                  aria-hidden="true"
                  className={cn("size-1.5 rounded-pill", metric.dot)}
                />
                {metric.label}
              </p>
              <p className="mt-1 font-mono text-data-lg font-semibold text-text-primary tabular-nums">
                {metric.value}
              </p>
              <p className="text-caption text-text-tertiary">Sample</p>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card flush>
          <div className="p-5 pb-0">
            <CardHeader title="Needs your review" />
          </div>
          <EmptyState
            title="No exceptions to review."
            body="Attendance for today is clear."
          />
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader
              title="August payroll"
              action={<StatusChip status={STATUS.notReady} size="sm" />}
            />
            <p className="text-secondary text-text-secondary">
              Not yet calculated. Payroll opens after attendance is recorded
              for the period.
            </p>
          </Card>

          <Card flush>
            <div className="p-5 pb-0">
              <CardHeader title="Recent activity" />
            </div>
            <EmptyState
              title="No activity yet."
              body="Configuration and approval events will appear here."
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
