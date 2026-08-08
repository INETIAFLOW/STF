"use server";

import { z } from "zod";
import { getDb } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { checkAccess } from "@/lib/authz/guard";
import { formatClockTime } from "@/lib/attendance/policy";

/**
 * Report export (screen A17).
 *
 * - Exporting is a SENSITIVE action: it needs `reports.export` and is
 *   recorded in the activity log with what was exported and when.
 * - Salary and bank details are never included here; payroll figures are
 *   exported from the payroll module by someone with payroll permission.
 * - Every export is tenant-scoped from the session.
 */

export type ExportResult =
  | { ok: true; filename: string; csv: string; rows: number }
  | { ok: false; error: string };

const schema = z.object({
  type: z.enum(["attendance", "leave", "tasks"]),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Optional location scope. The client value is a hint, never authority. */
  branchId: z.string().uuid().optional(),
});

/** RFC 4180 escaping so names with commas or quotes survive a round trip. */
function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");
}

export async function exportReportAction(
  input: z.input<typeof schema>,
): Promise<ExportResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Choose a report type and a period." };
  }
  if (parsed.data.to < parsed.data.from) {
    return { ok: false, error: "The end date cannot be before the start date." };
  }

  const moduleForType = {
    attendance: "ATTENDANCE",
    leave: "LEAVE",
    tasks: "TASKS",
  } as const;

  const { session, decision } = await checkAccess({
    module: moduleForType[parsed.data.type],
    permission: "reports.export",
  });
  if (!decision.allowed) {
    return {
      ok: false,
      error: decision.message ?? "You don't have access to export reports.",
    };
  }

  const db = getDb();
  const tz = session.tenant.timezone;
  const from = new Date(`${parsed.data.from}T00:00:00.000Z`);
  const to = new Date(`${parsed.data.to}T00:00:00.000Z`);

  // Re-validate the location against this tenant. A branch id from the
  // client must never scope a query on trust (Constitution §2).
  const branch = parsed.data.branchId
    ? await db.branch.findFirst({
        where: { id: parsed.data.branchId, tenantId: session.tenant.id },
        select: { id: true, name: true },
      })
    : null;
  const branchId = branch?.id ?? null;

  let headers: string[] = [];
  let rows: unknown[][] = [];

  if (parsed.data.type === "attendance") {
    const records = await db.attendanceRecord.findMany({
      where: {
        tenantId: session.tenant.id,
        workDate: { gte: from, lte: to },
        ...(branchId ? { branchId } : {}),
      },
      include: { membership: { include: { user: true } }, branch: true },
      orderBy: [{ workDate: "asc" }],
    });
    headers = [
      "Date",
      "Employee",
      "Employee code",
      "Check in",
      "Check out",
      "Hours",
      "Late minutes",
      "Location outcome",
      "Review status",
      "Branch",
    ];
    rows = records.map((r) => {
      const hours =
        r.checkInAt && r.checkOutAt
          ? ((r.checkOutAt.getTime() - r.checkInAt.getTime()) / 3_600_000).toFixed(2)
          : "";
      return [
        r.workDate.toISOString().slice(0, 10),
        r.membership.user.displayName,
        r.membership.employeeCode ?? "",
        r.checkInAt ? formatClockTime(r.checkInAt, tz) : "",
        r.checkOutAt ? formatClockTime(r.checkOutAt, tz) : "",
        hours,
        r.lateMinutes,
        r.checkInOutcome ?? "",
        r.reviewStatus,
        r.branch?.name ?? "",
      ];
    });
  } else if (parsed.data.type === "leave") {
    const requests = await db.leaveRequest.findMany({
      where: {
        tenantId: session.tenant.id,
        startDate: { lte: to },
        endDate: { gte: from },
        ...(branchId ? { membership: { branchId } } : {}),
      },
      include: { membership: { include: { user: true } } },
      orderBy: [{ startDate: "asc" }],
    });
    headers = [
      "From",
      "To",
      "Employee",
      "Type",
      "Status",
      "Paid",
      "Unpaid days",
      "Reason",
      "Decision reason",
    ];
    rows = requests.map((r) => [
      r.startDate.toISOString().slice(0, 10),
      r.endDate.toISOString().slice(0, 10),
      r.membership.user.displayName,
      r.type,
      r.status,
      r.paid == null ? "" : r.paid ? "Paid" : "Unpaid",
      Number(r.unpaidDays),
      r.reason,
      r.decisionReason ?? "",
    ]);
  } else {
    const tasks = await db.task.findMany({
      where: {
        tenantId: session.tenant.id,
        createdAt: { gte: from, lte: new Date(to.getTime() + 86_399_000) },
        ...(branchId ? { assignee: { branchId } } : {}),
      },
      include: {
        assignee: { include: { user: true } },
        createdBy: { include: { user: true } },
      },
      orderBy: [{ createdAt: "asc" }],
    });
    headers = [
      "Created",
      "Task",
      "Assignee",
      "Created by",
      "Priority",
      "Due date",
      "Proof required",
      "Status",
      "Completed",
    ];
    rows = tasks.map((t) => [
      t.createdAt.toISOString().slice(0, 10),
      t.title,
      t.assignee.user.displayName,
      t.createdBy.user.displayName,
      t.priority,
      t.dueDate ? t.dueDate.toISOString().slice(0, 10) : "",
      t.proofRequirement,
      t.status,
      t.completedAt ? t.completedAt.toISOString().slice(0, 10) : "",
    ]);
  }

  const scopeSuffix = branch
    ? `-${branch.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
    : "";
  const filename = `stf-${parsed.data.type}${scopeSuffix}-${parsed.data.from}-to-${parsed.data.to}.csv`;

  // Exports are recorded — who exported what, over what scope, and when
  // (Constitution §7).
  await recordAuditEvent(session, {
    action: "report.exported",
    entityType: "report",
    entityId: parsed.data.type,
    metadata: {
      type: parsed.data.type,
      from: parsed.data.from,
      to: parsed.data.to,
      rows: rows.length,
      filename,
      branch: branch?.name ?? "All branches",
    },
  });

  return {
    ok: true,
    filename,
    csv: toCsv(headers, rows),
    rows: rows.length,
  };
}
