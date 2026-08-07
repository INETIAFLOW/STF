import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { FileUpload } from "@/components/ui/FileUpload";

export const metadata: Metadata = { title: "Company settings" };

/**
 * Company / tenant settings shell (screen A24). Values are the tenant's
 * real settings, read-only until the save + audit flow ships.
 */
export default async function CompanySettingsPage() {
  const { session, decision } = await checkAccess({
    module: "EMPLOYEES",
    permission: "settings.manage",
  });
  if (!decision.allowed) redirect("/unauthorized");

  return (
    <div className="flex max-w-[720px] flex-col gap-5">
      <h1 className="font-heading text-h1 text-text-primary">
        Company settings
      </h1>

      <Alert variant="info" title="Read-only in this build">
        Editing company settings opens in a later build phase. Every change
        will be recorded in the activity log.
      </Alert>

      <Card>
        <CardHeader title="Company" />
        <div className="flex flex-col gap-1">
          <Input
            label="Company name"
            defaultValue={session.tenant.name}
            readOnly
          />
          <Input
            label="Timezone"
            defaultValue={session.tenant.timezone}
            helper="Times are stored in UTC and shown in this timezone."
            readOnly
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Company logo"
          meta="Appears on payslips and reports. PNG or SVG, at least 256px."
        />
        <FileUpload
          label="Logo file"
          constraintsText="PNG or SVG · up to 10 MB · storage connects in a later build phase"
          accept="image/png,image/svg+xml"
          maxFiles={1}
        />
      </Card>

      <Card>
        <CardHeader title="Data and privacy" />
        <p className="text-secondary text-text-secondary">
          Employees can ask for a copy of their own records. Deletion requests
          are handled subject to legal obligations. Retention windows for
          location, files, payroll and logs are defined before production use.
        </p>
      </Card>
    </div>
  );
}
