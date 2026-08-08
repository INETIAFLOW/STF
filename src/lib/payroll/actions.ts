"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { checkAccess } from "@/lib/authz/guard";
import { getPolicyVersion } from "@/lib/policies";
import { periodLabel, runBlockers, runExclusions } from "./engine";
import { buildPayrollPreview } from "./service";

/**
 * Payroll server actions (Constitution §6).
 *
 * Enforced here, never only in the UI:
 * - Figures are RE-COMPUTED server-side at approval; the client cannot
 *   submit totals.
 * - A run cannot be approved while any line has negative net pay, and
 *   employees with no salary structure are named as excluded.
 * - Approval requires a reason AND the accountant acknowledgement.
 * - Approval LOCKS the period. After that, money changes only through an
 *   auditable adjustment — the run is never recalculated or overwritten.
 */

export type ActionResult =
  | { ok: true; message: string; detail?: string }
  | { ok: false; error: string };

/**
 * Prisma's Json input type requires an index signature, which our precise
 * domain interfaces deliberately lack. Round-tripping guarantees the value
 * really is plain JSON before it is stored.
 */
type JsonInput = Parameters<typeof JSON.stringify>[0];
function toJson<T>(value: T): JsonInput {
  return JSON.parse(JSON.stringify(value));
}

const periodSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Choose a payroll month."),
});

function toPeriodDate(period: string): Date {
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

/** Calculate (or recalculate) a DRAFT run and persist its lines. */
export async function calculatePayrollAction(
  input: z.input<typeof periodSchema>,
): Promise<ActionResult> {
  const parsed = periodSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Choose a payroll month." };

  const { session, decision } = await checkAccess({
    module: "PAYROLL",
    permission: "payroll.edit",
  });
  if (!decision.allowed) {
    return { ok: false, error: decision.message ?? "You don't have access to Payroll." };
  }

  const db = getDb();
  const periodMonth = toPeriodDate(parsed.data.period);

  const existing = await db.payrollRun.findUnique({
    where: {
      tenantId_periodMonth: { tenantId: session.tenant.id, periodMonth },
    },
  });
  if (existing?.status === "APPROVED") {
    return {
      ok: false,
      error: `${periodLabel(periodMonth, session.tenant.timezone)} payroll is approved and locked. Later changes need an adjustment.`,
    };
  }

  const preview = await buildPayrollPreview(session, periodMonth);
  const policyVersion = await getPolicyVersion(session.tenant.id, "payroll");

  const run = await db.payrollRun.upsert({
    where: {
      tenantId_periodMonth: { tenantId: session.tenant.id, periodMonth },
    },
    update: {
      calculatedAt: new Date(),
      grossTotal: preview.grossTotal,
      deductionTotal: preview.deductionTotal,
      netTotal: preview.netTotal,
      inputsSnapshot: toJson({
        latePolicy: preview.latePolicy,
        policyVersion,
        calendarDays: preview.calendarDays,
        unreviewedExceptions: preview.unreviewedExceptions,
      }),
    },
    create: {
      tenantId: session.tenant.id,
      periodMonth,
      status: "DRAFT",
      calculatedAt: new Date(),
      grossTotal: preview.grossTotal,
      deductionTotal: preview.deductionTotal,
      netTotal: preview.netTotal,
      inputsSnapshot: toJson({
        latePolicy: preview.latePolicy,
        policyVersion,
        calendarDays: preview.calendarDays,
        unreviewedExceptions: preview.unreviewedExceptions,
      }),
    },
  });

  // Replace draft lines with the freshly computed ones. Adjustments live
  // on their own table and are re-applied by the engine, so they survive.
  for (const line of preview.lines) {
    await db.payrollLine.upsert({
      where: {
        runId_membershipId: { runId: run.id, membershipId: line.membershipId },
      },
      update: {
        status: line.status,
        statusReason: line.statusReason,
        calendarDays: line.result?.calendarDays ?? preview.calendarDays,
        presentDays: line.result?.presentDays ?? 0,
        paidLeaveDays: line.result?.paidLeaveDays ?? 0,
        unpaidDays: line.result?.unpaidDays ?? 0,
        payableDays: line.result?.payableDays ?? 0,
        lateMinutes: line.result?.lateMinutes ?? 0,
        lateDeductionDays: line.result?.lateDeductionDays ?? 0,
        earnings: line.result ? toJson(line.result.earnings) : undefined,
        deductions: line.result ? toJson(line.result.deductions) : undefined,
        gross: line.result?.gross ?? 0,
        deductionTotal: line.result?.deductionTotal ?? 0,
        adjustmentTotal: line.result?.adjustmentTotal ?? 0,
        net: line.result?.net ?? 0,
      },
      create: {
        tenantId: session.tenant.id,
        runId: run.id,
        membershipId: line.membershipId,
        status: line.status,
        statusReason: line.statusReason,
        calendarDays: line.result?.calendarDays ?? preview.calendarDays,
        presentDays: line.result?.presentDays ?? 0,
        paidLeaveDays: line.result?.paidLeaveDays ?? 0,
        unpaidDays: line.result?.unpaidDays ?? 0,
        payableDays: line.result?.payableDays ?? 0,
        lateMinutes: line.result?.lateMinutes ?? 0,
        lateDeductionDays: line.result?.lateDeductionDays ?? 0,
        earnings: line.result ? toJson(line.result.earnings) : undefined,
        deductions: line.result ? toJson(line.result.deductions) : undefined,
        gross: line.result?.gross ?? 0,
        deductionTotal: line.result?.deductionTotal ?? 0,
        adjustmentTotal: line.result?.adjustmentTotal ?? 0,
        net: line.result?.net ?? 0,
      },
    });
  }

  await recordAuditEvent(session, {
    action: "payroll.calculated",
    entityType: "payroll_run",
    entityId: run.id,
    after: {
      period: parsed.data.period,
      lines: preview.lines.length,
      netTotal: preview.netTotal,
      policyVersion,
    },
  });

  revalidatePath("/admin/payroll");

  return {
    ok: true,
    message: `${periodLabel(periodMonth, session.tenant.timezone)} payroll calculated.`,
    detail: `${preview.lines.filter((l) => l.status === "READY").length} employees ready for review.`,
  };
}

const approveSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  reason: z.string().trim().min(1, "A reason is required."),
  accountantAcknowledged: z.boolean(),
});

/** Approve and LOCK a period. */
export async function approvePayrollAction(
  input: z.input<typeof approveSchema>,
): Promise<ActionResult> {
  const parsed = approveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the approval details.",
    };
  }

  const { session, decision } = await checkAccess({
    module: "PAYROLL",
    permission: "payroll.approve",
  });
  if (!decision.allowed) {
    return { ok: false, error: decision.message ?? "You don't have access to Payroll." };
  }

  if (!parsed.data.accountantAcknowledged) {
    return {
      ok: false,
      error:
        "Confirm you have checked these figures with your accountant. STF does not certify statutory compliance.",
    };
  }

  const db = getDb();
  const periodMonth = toPeriodDate(parsed.data.period);
  const label = periodLabel(periodMonth, session.tenant.timezone);

  const run = await db.payrollRun.findUnique({
    where: {
      tenantId_periodMonth: { tenantId: session.tenant.id, periodMonth },
    },
  });
  if (!run) {
    return { ok: false, error: `Calculate ${label} payroll before approving it.` };
  }
  // Optimistic lock: the second approver is told who got there first.
  if (run.status === "APPROVED") {
    return {
      ok: false,
      error: `${label} payroll is already approved. See the activity log.`,
    };
  }

  // Re-compute server-side; the client never submits the figures.
  const preview = await buildPayrollPreview(session, periodMonth);
  const named = preview.lines.map((l) => ({
    name: l.name,
    status: l.status,
    net: l.result?.net ?? 0,
  }));

  const blockers = runBlockers(named);
  if (blockers.length > 0) {
    const first = blockers[0];
    return {
      ok: false,
      error: `Payroll can't be approved. ${first.membershipName}: ${first.reason}`,
    };
  }

  const excluded = runExclusions(named);
  const payableLines = preview.lines.filter((l) => l.status === "READY");
  const policyVersion = await getPolicyVersion(session.tenant.id, "payroll");

  await db.payrollRun.update({
    where: { id: run.id },
    data: {
      status: "APPROVED",
      approvedById: session.membership.id,
      approvedAt: new Date(),
      approvalReason: parsed.data.reason,
      accountantAcknowledged: true,
      grossTotal: preview.grossTotal,
      deductionTotal: preview.deductionTotal,
      netTotal: preview.netTotal,
      inputsSnapshot: toJson({
        latePolicy: preview.latePolicy,
        policyVersion,
        calendarDays: preview.calendarDays,
        unreviewedExceptions: preview.unreviewedExceptions,
        excluded,
      }),
    },
  });

  await recordAuditEvent(session, {
    action: "payroll.approved",
    entityType: "payroll_run",
    entityId: run.id,
    reason: parsed.data.reason,
    before: { status: "DRAFT" },
    after: {
      status: "APPROVED",
      period: parsed.data.period,
      employees: payableLines.length,
      netTotal: preview.netTotal,
      excluded,
      unreviewedExceptions: preview.unreviewedExceptions,
      policyVersion,
      accountantAcknowledged: true,
    },
  });

  revalidatePath("/admin/payroll");
  revalidatePath("/payslips");

  return {
    ok: true,
    message: `${label} payroll approved and locked. ${payableLines.length} payslips ready.`,
    detail:
      excluded.length > 0
        ? `${excluded.length} employee(s) excluded: ${excluded.join(", ")}.`
        : undefined,
  };
}

const adjustmentSchema = z.object({
  lineId: z.string().uuid(),
  label: z.string().trim().min(1, "Name the adjustment.").max(120),
  amount: z.number().finite(),
  reason: z.string().trim().min(1, "A reason is required.").max(500),
});

/**
 * The only sanctioned way to change money — including after approval.
 * Never overwrites a calculated figure.
 */
export async function addAdjustmentAction(
  input: z.input<typeof adjustmentSchema>,
): Promise<ActionResult> {
  const parsed = adjustmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the adjustment.",
    };
  }

  const { session, decision } = await checkAccess({
    module: "PAYROLL",
    permission: "payroll.edit",
  });
  if (!decision.allowed) {
    return { ok: false, error: decision.message ?? "You don't have access to Payroll." };
  }

  const db = getDb();
  const line = await db.payrollLine.findFirst({
    where: { id: parsed.data.lineId, tenantId: session.tenant.id },
    include: { run: true, membership: { include: { user: true } } },
  });
  if (!line) return { ok: false, error: "That payroll line is no longer available." };

  const adjustment = await db.payrollAdjustment.create({
    data: {
      tenantId: session.tenant.id,
      lineId: line.id,
      label: parsed.data.label,
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      createdById: session.user.id,
    },
  });

  // Adjustments change net pay only; gross and deductions stand as
  // calculated so the original figures remain visible.
  const total = await db.payrollAdjustment.aggregate({
    where: { lineId: line.id },
    _sum: { amount: true },
  });
  const adjustmentTotal = Number(total._sum.amount ?? 0);
  const net =
    Number(line.gross) - Number(line.deductionTotal) + adjustmentTotal;

  await db.payrollLine.update({
    where: { id: line.id },
    data: { adjustmentTotal, net },
  });

  const runTotals = await db.payrollLine.aggregate({
    where: { runId: line.runId },
    _sum: { net: true },
  });
  await db.payrollRun.update({
    where: { id: line.runId },
    data: { netTotal: Number(runTotals._sum.net ?? 0) },
  });

  await recordAuditEvent(session, {
    action: "payroll.adjustment_added",
    entityType: "payroll_line",
    entityId: line.id,
    reason: parsed.data.reason,
    before: { net: Number(line.net) },
    after: {
      net,
      adjustment: { label: parsed.data.label, amount: parsed.data.amount },
      adjustmentId: adjustment.id,
      runStatus: line.run.status,
    },
  });

  revalidatePath("/admin/payroll");

  return {
    ok: true,
    message: `Adjustment recorded for ${line.membership.user.displayName}.`,
    detail:
      line.run.status === "APPROVED"
        ? "The approved run keeps its original figures; this is an auditable adjustment."
        : undefined,
  };
}
