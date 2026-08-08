import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { getDb } from "@/lib/db";
import { devFixtureOffline } from "@/lib/auth/fixture";
import { getPolicy, getPolicyVersion } from "@/lib/policies";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader } from "@/components/ui/Card";
import { DEFAULT_LATE_POLICY, type LatePolicy } from "@/lib/payroll/engine";
import { PolicyForms } from "./PolicyForms";

export const metadata: Metadata = { title: "Attendance policy" };

interface AttendancePolicy {
  graceMinutes: number;
  radiusM: number;
  requireReasonOutsideArea: boolean;
}

const DEFAULT_ATTENDANCE: AttendancePolicy = {
  graceMinutes: 10,
  radiusM: 300,
  requireReasonOutsideArea: true,
};

/** Attendance, shift and payroll-rule settings (screens A11/A12/A13). */
export default async function AttendancePolicyPage() {
  const { session, decision } = await checkAccess({
    module: "ATTENDANCE",
    permission: "policy.edit",
  });
  if (!decision.allowed) redirect("/unauthorized");

  if (devFixtureOffline()) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-heading text-h1 text-text-primary">
          Attendance policy
        </h1>
        <Alert variant="info" title="Connect a database to edit policies." />
      </div>
    );
  }

  const db = getDb();
  const [attendance, payroll, attendanceVersion, payrollVersion, shifts] =
    await Promise.all([
      getPolicy<AttendancePolicy>(session.tenant.id, "attendance"),
      getPolicy<Partial<LatePolicy>>(session.tenant.id, "payroll"),
      getPolicyVersion(session.tenant.id, "attendance"),
      getPolicyVersion(session.tenant.id, "payroll"),
      db.shift.findMany({
        where: { tenantId: session.tenant.id },
        orderBy: { startMinutes: "asc" },
      }),
    ]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-h1 text-text-primary">
          Attendance &amp; payroll rules
        </h1>
        <Link
          href="/admin/settings"
          className="text-label text-brand-primary underline-offset-2 hover:underline"
        >
          Company settings
        </Link>
      </div>

      <Alert variant="info" title="Changing a rule never rewrites the past">
        Saving creates a new policy version. Attendance already recorded and
        payroll already approved keep the version that applied to them.
      </Alert>

      <PolicyForms
        attendance={{ ...DEFAULT_ATTENDANCE, ...(attendance ?? {}) }}
        attendanceVersion={attendanceVersion}
        payroll={{ ...DEFAULT_LATE_POLICY, ...(payroll ?? {}) }}
        payrollVersion={payrollVersion}
        shifts={shifts.map((shift) => ({
          id: shift.id,
          name: shift.name,
          startMinutes: shift.startMinutes,
          endMinutes: shift.endMinutes,
          graceMinutes: shift.graceMinutes,
        }))}
      />

      <Card>
        <CardHeader title="Not in this version" />
        <ul className="flex list-disc flex-col gap-1 pl-5 text-secondary text-text-secondary">
          <li>Holiday calendar and earned-leave balances</li>
          <li>Biometric, face, QR or RFID attendance</li>
          <li>Continuous or background location tracking</li>
        </ul>
        <p className="mt-2 text-caption text-text-secondary">
          These are deliberately out of scope. Location is captured only at
          check-in and check-out.
        </p>
      </Card>
    </div>
  );
}
