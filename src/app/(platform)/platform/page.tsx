import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/authz/guard";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { Table } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Status } from "@/lib/status";
import { TenantStatusControl } from "./TenantStatusControl";

export const metadata: Metadata = { title: "Companies" };

interface Row {
  id: string;
  name: string;
  slug: string;
  people: number;
  activity: string;
  created: string;
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
}

function tenantStatus(key: Row["status"]): Status {
  if (key === "ACTIVE") return { key: "tenant-active", label: "Active", tone: "success" };
  if (key === "SUSPENDED")
    return { key: "tenant-suspended", label: "Suspended", tone: "warning" };
  return { key: "tenant-archived", label: "Archived", tone: "neutral" };
}

function when(date: Date | null): string {
  if (!date) return "Never";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default async function PlatformCompaniesPage() {
  await requirePlatformAdmin();
  const db = getDb();

  const tenants = await db.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { memberships: true } },
      // The truest sign of life for a workforce product: a company nobody
      // checks into is one about to leave, and that is worth seeing before
      // the renewal conversation rather than after it.
      attendanceRecords: {
        orderBy: { workDate: "desc" },
        take: 1,
        select: { workDate: true },
      },
    },
  });

  const rows: Row[] = tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    people: t._count.memberships,
    activity: when(t.attendanceRecords[0]?.workDate ?? null),
    created: when(t.createdAt),
    status: t.status,
  }));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h1 text-text-primary">Companies</h1>
          <p className="mt-1 text-secondary text-text-secondary">
            {rows.length} on the platform.
          </p>
        </div>
        <Link
          href="/platform/new"
          className="inline-flex h-11 items-center rounded-button bg-brand-primary px-4 font-heading text-label text-text-on-primary hover:bg-brand-primary-hover"
        >
          Add a company
        </Link>
      </div>

      <div className="mt-5">
        <Table<Row>
          caption="Companies on the platform"
          rows={rows}
          rowKey={(row) => row.id}
          empty={
            <Card>
              <EmptyState
                title="No companies yet."
                body="Add the first one — you'll get a link to send its owner."
              />
            </Card>
          }
          columns={[
            {
              key: "name",
              header: "Company",
              rowHeader: true,
              render: (row) => (
                <span className="block">
                  <span className="block font-semibold text-text-primary">
                    {row.name}
                  </span>
                  <span className="block font-mono text-mono text-text-tertiary">
                    {row.slug}
                  </span>
                </span>
              ),
            },
            { key: "people", header: "People", numeric: true, render: (row) => row.people },
            { key: "activity", header: "Last check-in", render: (row) => row.activity },
            { key: "created", header: "Added", render: (row) => row.created },
            {
              key: "status",
              header: "Status",
              render: (row) => <StatusChip status={tenantStatus(row.status)} size="sm" />,
            },
            {
              key: "action",
              header: "",
              render: (row) => (
                <TenantStatusControl
                  tenantId={row.id}
                  name={row.name}
                  status={row.status}
                  people={row.people}
                />
              ),
            },
          ]}
          renderMobileCard={(row) => (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-text-primary">{row.name}</p>
                  <p className="font-mono text-mono text-text-tertiary">{row.slug}</p>
                </div>
                <StatusChip status={tenantStatus(row.status)} size="sm" />
              </div>
              <dl className="flex flex-col gap-1 text-secondary text-text-secondary">
                <div className="flex justify-between gap-3">
                  <dt>People</dt>
                  <dd className="text-text-primary">{row.people}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Last check-in</dt>
                  <dd className="text-text-primary">{row.activity}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Added</dt>
                  <dd className="text-text-primary">{row.created}</dd>
                </div>
              </dl>
              <TenantStatusControl
                tenantId={row.id}
                name={row.name}
                status={row.status}
                people={row.people}
              />
            </div>
          )}
        />
      </div>
    </>
  );
}
