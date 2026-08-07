import type { Metadata } from "next";
import { requireSession } from "@/lib/authz/guard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { STATUS } from "@/lib/status";

export const metadata: Metadata = { title: "Profile" };

/** Employee profile shell (screen E16). */
export default async function EmployeeProfilePage() {
  const session = await requireSession();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="mt-2 font-heading text-h1 text-text-primary">Profile</h1>

      <Card>
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-avatar bg-brand-primary-subtle font-heading text-h3 text-brand-primary"
          >
            {session.user.displayName
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0] ?? "")
              .join("")
              .toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-body-lg font-semibold text-text-primary">
              {session.user.displayName}
            </p>
            <p className="text-secondary text-text-secondary">
              {session.membership.roleName} · {session.tenant.name}
            </p>
            {session.membership.employeeCode && (
              <p className="font-mono text-mono text-text-tertiary uppercase">
                {session.membership.employeeCode}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Account" />
        <dl className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-secondary text-text-secondary">Email</dt>
            <dd className="text-body text-text-primary">
              {session.user.email ?? "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-secondary text-text-secondary">Status</dt>
            <dd>
              <StatusChip status={STATUS.active} size="sm" />
            </dd>
          </div>
        </dl>
      </Card>

      <p className="text-caption text-text-secondary">
        Your company records your check-in time and permitted location. You
        can see everything recorded about you in Attendance history.
      </p>

      <form action="/auth/sign-out" method="post">
        <Button type="submit" variant="outline" size="lg" className="w-full">
          Sign out
        </Button>
      </form>
    </div>
  );
}
