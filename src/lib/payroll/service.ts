import "server-only";

import { getDb } from "@/lib/db";
import type { AppSession } from "@/lib/auth/types";
import { getPolicy } from "@/lib/policies";
import {
  DEFAULT_LATE_POLICY,
  calculatePayrollLine,
  daysInPeriod,
  type AttendanceSummary,
  type ComponentDefinition,
  type LatePolicy,
  type PayrollLineResult,
  type SalaryStructureInput,
} from "./engine";

/**
 * Gathers the APPROVED inputs a payroll period is calculated from and
 * runs the pure engine over them. Nothing here invents a rule: policy
 * comes from tenant configuration, money comes from the employee's
 * salary structure, days come from attendance and decided leave.
 */

export interface PayrollLineDraft {
  membershipId: string;
  name: string;
  employeeCode: string | null;
  status: "READY" | "NO_SALARY_STRUCTURE" | "BLOCKED";
  statusReason: string | null;
  result: PayrollLineResult | null;
}

export interface PayrollPreview {
  periodMonth: Date;
  calendarDays: number;
  latePolicy: LatePolicy;
  lines: PayrollLineDraft[];
  /** Attendance exceptions still unreviewed in the period. */
  unreviewedExceptions: number;
  grossTotal: number;
  deductionTotal: number;
  netTotal: number;
}

/** Start of a payroll month as a UTC date-only value. */
export function periodStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

/** The month currently being worked on, in the tenant's timezone. */
export function currentPeriod(timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone,
  }).format(new Date());
  const [year, month] = parts.split("-").map(Number);
  return periodStart(year, month);
}

export async function loadLatePolicy(tenantId: string): Promise<LatePolicy> {
  const stored = await getPolicy<Partial<LatePolicy>>(tenantId, "payroll");
  return { ...DEFAULT_LATE_POLICY, ...(stored ?? {}) };
}

/**
 * Build a preview for a period from live data. This is what the payroll
 * dashboard shows before anything is written, and what the approval
 * action re-computes server-side so the figures cannot be tampered with.
 */
export async function buildPayrollPreview(
  session: AppSession,
  periodMonth: Date,
): Promise<PayrollPreview> {
  const db = getDb();
  const tenantId = session.tenant.id;
  const calendarDays = daysInPeriod(periodMonth);
  const periodEnd = new Date(
    Date.UTC(
      periodMonth.getUTCFullYear(),
      periodMonth.getUTCMonth(),
      calendarDays,
    ),
  );
  const latePolicy = await loadLatePolicy(tenantId);

  const [members, components, structures, attendance, leave, unreviewed, existingRun] =
    await Promise.all([
      db.tenantMembership.findMany({
        where: { tenantId, status: "ACTIVE" },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      }),
      db.salaryComponent.findMany({
        where: { tenantId, isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      db.salaryStructure.findMany({
        where: { tenantId, effectiveFrom: { lte: periodEnd } },
        include: { lines: true },
        orderBy: { effectiveFrom: "desc" },
      }),
      db.attendanceRecord.findMany({
        where: {
          tenantId,
          workDate: { gte: periodMonth, lte: periodEnd },
        },
        select: {
          membershipId: true,
          workDate: true,
          checkInAt: true,
          lateMinutes: true,
          reviewStatus: true,
          exemptionStatus: true,
        },
      }),
      db.leaveRequest.findMany({
        where: {
          tenantId,
          status: "APPROVED",
          startDate: { lte: periodEnd },
          endDate: { gte: periodMonth },
        },
        select: {
          membershipId: true,
          startDate: true,
          endDate: true,
          type: true,
          paid: true,
          unpaidDays: true,
        },
      }),
      db.attendanceRecord.count({
        where: {
          tenantId,
          workDate: { gte: periodMonth, lte: periodEnd },
          reviewStatus: "PENDING",
        },
      }),
      db.payrollRun.findUnique({
        where: { tenantId_periodMonth: { tenantId, periodMonth } },
        include: { lines: { include: { adjustments: true } } },
      }),
    ]);

  const componentById = new Map(components.map((c) => [c.id, c]));

  // Most recent structure effective on or before the period end wins.
  const structureByMembership = new Map<string, (typeof structures)[number]>();
  for (const structure of structures) {
    if (!structureByMembership.has(structure.membershipId)) {
      structureByMembership.set(structure.membershipId, structure);
    }
  }

  const lines: PayrollLineDraft[] = [];

  for (const member of members) {
    const structure = structureByMembership.get(member.id);
    if (!structure) {
      lines.push({
        membershipId: member.id,
        name: member.user.displayName,
        employeeCode: member.employeeCode,
        status: "NO_SALARY_STRUCTURE",
        statusReason: "No salary structure",
        result: null,
      });
      continue;
    }

    const records = attendance.filter((r) => r.membershipId === member.id);
    const presentDays = records.filter((r) => r.checkInAt).length;
    const lateDays = records.filter(
      (r) => r.lateMinutes > 0 && r.exemptionStatus !== "EXEMPTED",
    ).length;
    const lateMinutes = records.reduce(
      (sum, r) => sum + (r.exemptionStatus === "EXEMPTED" ? 0 : r.lateMinutes),
      0,
    );

    const memberLeave = leave.filter((l) => l.membershipId === member.id);
    const paidLeaveDays = memberLeave
      .filter((l) => l.paid === true)
      .reduce((sum, l) => sum + overlapDays(l, periodMonth, periodEnd), 0);
    const unpaidLeaveDays = memberLeave
      .filter((l) => l.paid !== true)
      .reduce((sum, l) => sum + overlapDays(l, periodMonth, periodEnd), 0);

    // Days with neither attendance nor approved leave.
    const accountedDays = presentDays + paidLeaveDays + unpaidLeaveDays;
    const absentDays = Math.max(0, calendarDays - accountedDays);

    const summary: AttendanceSummary = {
      calendarDays,
      presentDays,
      paidLeaveDays,
      unpaidLeaveDays,
      absentDays,
      lateDays,
      lateMinutes,
    };

    const definitions: ComponentDefinition[] = structure.lines
      .map((line) => {
        const component = componentById.get(line.componentId);
        if (!component) return null;
        return {
          key: component.key,
          name: component.name,
          kind: component.kind,
          calculation: component.calculation,
          isStatutory: component.isStatutory,
          prorated: component.prorated,
          amount: Number(line.amount),
          percent: Number(line.percent),
        } satisfies ComponentDefinition;
      })
      .filter((c): c is ComponentDefinition => c !== null);

    const structureInput: SalaryStructureInput = {
      baseAmount: Number(structure.baseAmount),
      components: definitions,
    };

    const savedLine = existingRun?.lines.find(
      (l) => l.membershipId === member.id,
    );
    const adjustments = (savedLine?.adjustments ?? []).map((a) => ({
      label: a.label,
      amount: Number(a.amount),
    }));

    const result = calculatePayrollLine({
      structure: structureInput,
      attendance: summary,
      policy: latePolicy,
      adjustments,
    });

    lines.push({
      membershipId: member.id,
      name: member.user.displayName,
      employeeCode: member.employeeCode,
      status: result.net < 0 ? "BLOCKED" : "READY",
      statusReason:
        result.net < 0
          ? "Net pay is negative. Add an adjustment before approving."
          : null,
      result,
    });
  }

  const payable = lines.filter((l) => l.result);
  return {
    periodMonth,
    calendarDays,
    latePolicy,
    lines,
    unreviewedExceptions: unreviewed,
    grossTotal: payable.reduce((sum, l) => sum + (l.result?.gross ?? 0), 0),
    deductionTotal: payable.reduce(
      (sum, l) => sum + (l.result?.deductionTotal ?? 0),
      0,
    ),
    netTotal: payable.reduce((sum, l) => sum + (l.result?.net ?? 0), 0),
  };
}

/** Whole days of a leave request that fall inside the period. */
function overlapDays(
  leave: { startDate: Date; endDate: Date; type: string; unpaidDays: number },
  periodStartDate: Date,
  periodEndDate: Date,
): number {
  if (leave.type === "HALF_DAY") return 0.5;
  const start = leave.startDate > periodStartDate ? leave.startDate : periodStartDate;
  const end = leave.endDate < periodEndDate ? leave.endDate : periodEndDate;
  const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.max(0, days);
}
