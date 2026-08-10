import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { checkAccess } from "@/lib/authz/guard";
import { getDb } from "@/lib/db";
import { devFixtureOffline } from "@/lib/auth/fixture";
import { emailConfigured } from "@/lib/email/send";
import { supabaseAdminConfigured } from "@/lib/supabase/admin";
import { Alert } from "@/components/ui/Alert";
import { InviteEmployeeForm } from "./InviteEmployeeForm";

export const metadata: Metadata = { title: "Add employee" };

/**
 * Add an employee, and invite them to sign in.
 *
 * Guarded server-side on `employees.manage` — the missing "Add" button on
 * the directory is a courtesy, this is the control (Constitution §5).
 */
export default async function NewEmployeePage() {
  const { session, decision } = await checkAccess({
    module: "EMPLOYEES",
    permission: "employees.manage",
  });
  if (!decision.allowed) redirect("/unauthorized");

  const db = getDb();
  const offline = devFixtureOffline();
  const tenantId = session.tenant.id;

  const [roles, departments, managers, branches, shifts] = offline
    ? [[], [], [], [], []]
    : await Promise.all([
        db.role.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
        db.department.findMany({
          where: { tenantId, isActive: true },
          orderBy: { name: "asc" },
        }),
        db.tenantMembership.findMany({
          where: { tenantId, status: "ACTIVE" },
          include: { user: true },
          orderBy: { createdAt: "asc" },
          take: 200,
        }),
        db.branch.findMany({
          where: { tenantId, isActive: true },
          orderBy: { name: "asc" },
        }),
        db.shift.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
      ]);

  const canSignIn = supabaseAdminConfigured();

  return (
    <div className="flex max-w-[720px] flex-col gap-5">
      <div>
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-1 text-label text-brand-primary underline-offset-2 hover:underline"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Employees
        </Link>
        <h1 className="mt-2 font-heading text-h1 text-text-primary">
          Add employee
        </h1>
        <p className="mt-1 text-body text-text-secondary">
          Only a name, mobile number and role are needed. Everything else can
          come later.
        </p>
      </div>

      {!canSignIn && (
        <Alert variant="warning" title="Sign-in accounts aren't connected yet">
          You can add people and record their attendance, but nobody can sign
          in until the Supabase secret key is configured (DEPLOY.md, step 3).
        </Alert>
      )}

      <InviteEmployeeForm
        roles={roles.map((r) => ({ value: r.id, label: r.name }))}
        departments={departments.map((d) => ({ value: d.id, label: d.name }))}
        managers={managers.map((m) => ({
          value: m.id,
          label: m.user.displayName,
        }))}
        branches={branches.map((b) => ({ value: b.id, label: b.name }))}
        shifts={shifts.map((s) => ({ value: s.id, label: s.name }))}
        emailConfigured={emailConfigured()}
      />
    </div>
  );
}
