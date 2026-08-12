import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { getDb } from "@/lib/db";
import { devFixtureOffline } from "@/lib/auth/fixture";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { Table } from "@/components/ui/Table";
import { STATUS, type Status } from "@/lib/status";
import { formatRupees } from "@/lib/payroll/engine";
import { ComponentEditor, StructureEditor } from "./Editors";

/** Same wording in the table and the mobile card — one source, not two. */
function structureStatus(hasStructure: boolean): Status {
  return hasStructure
    ? STATUS.ready
    : { key: "no-structure", label: "No salary structure", tone: "neutral" };
}

function formatEffectiveFrom(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export const metadata: Metadata = { title: "Salary structures" };

/**
 * Salary components and per-employee structures.
 *
 * This is where a tenant defines what it pays and deducts. STF ships no
 * statutory formulas — PF, ESI, professional tax and TDS are components
 * the customer's accountant defines here (D-019).
 */
export default async function SalaryStructuresPage() {
  const { session, decision } = await checkAccess({
    module: "PAYROLL",
    permission: "payroll.view",
  });
  if (!decision.allowed) redirect("/unauthorized");

  const canEdit = session.permissions.has("payroll.edit");

  if (devFixtureOffline()) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-heading text-h1 text-text-primary">
          Salary structures
        </h1>
        <Card flush>
          <EmptyState
            title="No salary components yet."
            body="Connect a database to configure payroll."
          />
        </Card>
      </div>
    );
  }

  const db = getDb();
  const [components, members, structures] = await Promise.all([
    db.salaryComponent.findMany({
      where: { tenantId: session.tenant.id },
      orderBy: { sortOrder: "asc" },
    }),
    db.tenantMembership.findMany({
      where: { tenantId: session.tenant.id, status: "ACTIVE" },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    db.salaryStructure.findMany({
      where: { tenantId: session.tenant.id },
      include: { lines: true },
      orderBy: { effectiveFrom: "desc" },
    }),
  ]);

  const latestByMember = new Map<string, (typeof structures)[number]>();
  for (const structure of structures) {
    if (!latestByMember.has(structure.membershipId)) {
      latestByMember.set(structure.membershipId, structure);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-h1 text-text-primary">
          Salary structures
        </h1>
        <Link
          href="/admin/payroll"
          className="text-label text-brand-primary underline-offset-2 hover:underline"
        >
          Back to payroll
        </Link>
      </div>

      <Alert variant="info" title="You define your own components">
        STF does not supply statutory rules or rates. Anything your
        accountant requires — provident fund, professional tax, insurance —
        is added here as a component with the amount or percentage they
        give you, and marked as defined by your accountant.
      </Alert>

      <section aria-labelledby="components">
        <h2
          id="components"
          className="mb-3 font-heading text-h2 text-text-primary"
        >
          Components ({components.length})
        </h2>

        {components.length === 0 ? (
          <Card flush>
            <EmptyState
              title="No components yet."
              body="Add what your company pays and deducts each month."
            />
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {components.map((component) => (
              <Card key={component.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-h3 text-text-primary">
                      {component.name}
                    </h3>
                    <p className="mt-0.5 font-mono text-mono text-text-tertiary uppercase">
                      {component.key}
                    </p>
                  </div>
                  <StatusChip
                    status={
                      component.kind === "EARNING"
                        ? { key: "earning", label: "Earning", tone: "success" }
                        : { key: "deduction", label: "Deduction", tone: "neutral" }
                    }
                    size="sm"
                  />
                </div>
                <dl className="mt-3 flex flex-col gap-1 text-secondary text-text-secondary">
                  <div className="flex justify-between gap-3">
                    <dt>Calculated as</dt>
                    <dd className="text-text-primary">
                      {component.calculation === "PERCENT_OF_BASE"
                        ? "Percentage of base"
                        : component.calculation === "PER_DAY"
                          ? "Per payable day"
                          : "Fixed monthly amount"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Reduced by unpaid days</dt>
                    <dd className="text-text-primary">
                      {component.prorated ? "Yes" : "No"}
                    </dd>
                  </div>
                  {component.isStatutory && (
                    <div className="flex justify-between gap-3">
                      <dt>Defined by</dt>
                      <dd className="text-text-primary">Your accountant</dd>
                    </div>
                  )}
                </dl>
              </Card>
            ))}
          </div>
        )}

        {canEdit && (
          <div className="mt-4">
            <ComponentEditor />
          </div>
        )}
      </section>

      <section aria-labelledby="structures">
        <h2
          id="structures"
          className="mb-3 font-heading text-h2 text-text-primary"
        >
          Employees ({members.length})
        </h2>

        {/*
          Uses the shared Table, whose `renderMobileCard` is REQUIRED. This
          table previously had none and sat inside `overflow-hidden`, which
          clips rather than scrolls — so on a phone the Effective-from and
          Status columns were cut off with no way to reach them, on a screen
          whose entire payload is salary figures.
        */}
        <Table
          caption="Salary structure per employee"
          rows={members}
          rowKey={(member) => member.id}
          columns={[
            {
              key: "employee",
              header: "Employee",
              rowHeader: true,
              render: (member) => member.user.displayName,
            },
            {
              key: "base",
              header: "Base",
              numeric: true,
              render: (member) => {
                const structure = latestByMember.get(member.id);
                return structure
                  ? formatRupees(Number(structure.baseAmount))
                  : "—";
              },
            },
            {
              key: "components",
              header: "Components",
              numeric: true,
              render: (member) =>
                latestByMember.get(member.id)?.lines.length ?? "—",
            },
            {
              key: "effectiveFrom",
              header: "Effective from",
              render: (member) => {
                const structure = latestByMember.get(member.id);
                return structure ? formatEffectiveFrom(structure.effectiveFrom) : "—";
              },
            },
            {
              key: "status",
              header: "Status",
              render: (member) => (
                <StatusChip
                  status={structureStatus(latestByMember.has(member.id))}
                  size="sm"
                />
              ),
            },
          ]}
          renderMobileCard={(member) => {
            const structure = latestByMember.get(member.id);
            return (
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-body font-semibold text-text-primary">
                    {member.user.displayName}
                  </p>
                  <StatusChip status={structureStatus(Boolean(structure))} size="sm" />
                </div>
                <dl className="mt-2 flex flex-col gap-1 text-secondary">
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-secondary">Base</dt>
                    <dd className="font-mono text-data text-text-primary tabular-nums">
                      {structure ? formatRupees(Number(structure.baseAmount)) : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-secondary">Components</dt>
                    <dd className="font-mono text-data text-text-primary tabular-nums">
                      {structure ? structure.lines.length : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-secondary">Effective from</dt>
                    <dd className="font-mono text-data text-text-primary tabular-nums">
                      {structure ? formatEffectiveFrom(structure.effectiveFrom) : "—"}
                    </dd>
                  </div>
                </dl>
              </Card>
            );
          }}
        />

        {canEdit && components.length > 0 && (
          <div className="mt-4">
            <StructureEditor
              members={members.map((m) => ({
                id: m.id,
                name: m.user.displayName,
              }))}
              components={components.map((c) => ({
                id: c.id,
                name: c.name,
                kind: c.kind,
                calculation: c.calculation,
              }))}
            />
          </div>
        )}
      </section>
    </div>
  );
}
