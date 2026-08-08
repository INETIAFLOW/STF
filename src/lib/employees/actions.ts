"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { checkAccess } from "@/lib/authz/guard";

/**
 * Employee records (MODULES.md → Employee Management).
 *
 * A membership IS the workforce record — attendance, leave, tasks and
 * payroll all point at it — so profile fields live there rather than in a
 * parallel "employee" table.
 *
 * This is where a person's home location and roaming capability are set,
 * which is what makes multi-location usable.
 */

export type ActionResult =
  | { ok: true; message: string; detail?: string }
  | { ok: false; error: string };

const profileSchema = z.object({
  membershipId: z.string().uuid(),
  displayName: z.string().trim().min(1, "Give the person a name.").max(120),
  employeeCode: z.string().trim().max(40).optional(),
  designation: z.string().trim().max(120).optional(),
  joinedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  branchId: z.string().uuid().nullable(),
  shiftId: z.string().uuid().nullable(),
  reportingToId: z.string().uuid().nullable(),
  canCheckInAtAnyBranch: z.boolean(),
  status: z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED"]),
});

export async function saveEmployeeAction(
  input: z.input<typeof profileSchema>,
): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the employee details.",
    };
  }

  const { session, decision } = await checkAccess({
    module: "EMPLOYEES",
    permission: "employees.manage",
  });
  if (!decision.allowed) {
    return { ok: false, error: decision.message ?? "You don't have access to this." };
  }

  const db = getDb();
  const membership = await db.tenantMembership.findFirst({
    where: { id: parsed.data.membershipId, tenantId: session.tenant.id },
    include: { user: true, branch: true, shift: true },
  });
  if (!membership) {
    return { ok: false, error: "That employee is no longer available." };
  }

  // Every referenced record must belong to this tenant — the ids arrive
  // from a form (Constitution §2).
  for (const [label, id, check] of [
    [
      "location",
      parsed.data.branchId,
      () =>
        db.branch.count({
          where: { id: parsed.data.branchId!, tenantId: session.tenant.id },
        }),
    ],
    [
      "shift",
      parsed.data.shiftId,
      () =>
        db.shift.count({
          where: { id: parsed.data.shiftId!, tenantId: session.tenant.id },
        }),
    ],
    [
      "manager",
      parsed.data.reportingToId,
      () =>
        db.tenantMembership.count({
          where: {
            id: parsed.data.reportingToId!,
            tenantId: session.tenant.id,
          },
        }),
    ],
  ] as const) {
    if (id && (await check()) === 0) {
      return { ok: false, error: `That ${label} is no longer available.` };
    }
  }

  // Someone cannot report to themselves.
  if (parsed.data.reportingToId === membership.id) {
    return { ok: false, error: "A person cannot report to themselves." };
  }

  const before = {
    displayName: membership.user.displayName,
    employeeCode: membership.employeeCode,
    designation: membership.designation,
    branch: membership.branch?.name ?? null,
    shift: membership.shift?.name ?? null,
    canCheckInAtAnyBranch: membership.canCheckInAtAnyBranch,
    status: membership.status,
  };

  await db.$transaction([
    db.user.update({
      where: { id: membership.userId },
      data: { displayName: parsed.data.displayName },
    }),
    db.tenantMembership.update({
      where: { id: membership.id },
      data: {
        employeeCode: parsed.data.employeeCode || null,
        designation: parsed.data.designation || null,
        joinedOn: parsed.data.joinedOn
          ? new Date(`${parsed.data.joinedOn}T00:00:00.000Z`)
          : null,
        branchId: parsed.data.branchId,
        shiftId: parsed.data.shiftId,
        reportingToId: parsed.data.reportingToId,
        canCheckInAtAnyBranch: parsed.data.canCheckInAtAnyBranch,
        status: parsed.data.status,
      },
    }),
  ]);

  const updated = await db.tenantMembership.findUniqueOrThrow({
    where: { id: membership.id },
    include: { branch: true, shift: true },
  });

  await recordAuditEvent(session, {
    action: "employee.updated",
    entityType: "tenant_membership",
    entityId: membership.id,
    before,
    after: {
      displayName: parsed.data.displayName,
      employeeCode: parsed.data.employeeCode || null,
      designation: parsed.data.designation || null,
      branch: updated.branch?.name ?? null,
      shift: updated.shift?.name ?? null,
      canCheckInAtAnyBranch: parsed.data.canCheckInAtAnyBranch,
      status: parsed.data.status,
    },
  });

  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${membership.id}`);

  const roamingChanged =
    membership.canCheckInAtAnyBranch !== parsed.data.canCheckInAtAnyBranch;

  return {
    ok: true,
    message: `${parsed.data.displayName} saved.`,
    detail: roamingChanged
      ? parsed.data.canCheckInAtAnyBranch
        ? "They can now check in at any of your locations."
        : "They can now only check in at their own location."
      : undefined,
  };
}

/**
 * Reveal a sensitive block (salary or bank details) — permission-checked
 * AND recorded. Constitution §7: sensitive data is never rendered inline
 * "just in case", and every access is logged.
 */
const revealSchema = z.object({
  membershipId: z.string().uuid(),
  kind: z.enum(["salary", "bank"]),
});

export type RevealResult =
  | { ok: true; lines: Array<{ label: string; value: string }> }
  | { ok: false; error: string };

export async function revealSensitiveAction(
  input: z.input<typeof revealSchema>,
): Promise<RevealResult> {
  const parsed = revealSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That could not be read." };

  const permission = parsed.data.kind === "salary" ? "payroll.view" : "bank.view";
  const { session, decision } = await checkAccess({
    module: parsed.data.kind === "salary" ? "PAYROLL" : "EMPLOYEES",
    permission,
  });
  if (!decision.allowed) {
    return {
      ok: false,
      error: decision.message ?? "You don't have access to this.",
    };
  }

  const db = getDb();
  const membership = await db.tenantMembership.findFirst({
    where: { id: parsed.data.membershipId, tenantId: session.tenant.id },
    include: { user: true },
  });
  if (!membership) {
    return { ok: false, error: "That employee is no longer available." };
  }

  // Logged BEFORE the value is returned, so an access is recorded even if
  // the caller drops the response.
  await recordAuditEvent(session, {
    action: `employee.${parsed.data.kind}_viewed`,
    entityType: "tenant_membership",
    entityId: membership.id,
    metadata: { employee: membership.user.displayName },
  });

  if (parsed.data.kind === "bank") {
    // Bank details are not collected in this version — say so plainly
    // rather than showing an empty block.
    return {
      ok: true,
      lines: [
        {
          label: "Bank details",
          value: "Not collected in this version.",
        },
      ],
    };
  }

  const structure = await db.salaryStructure.findFirst({
    where: { tenantId: session.tenant.id, membershipId: membership.id },
    orderBy: { effectiveFrom: "desc" },
    include: { lines: { include: { component: true } } },
  });

  if (!structure) {
    return {
      ok: true,
      lines: [{ label: "Salary structure", value: "Not set" }],
    };
  }

  return {
    ok: true,
    lines: [
      {
        label: "Base amount",
        value: `₹${Number(structure.baseAmount).toLocaleString("en-IN")}`,
      },
      {
        label: "Effective from",
        value: structure.effectiveFrom.toISOString().slice(0, 10),
      },
      ...structure.lines.map((line) => ({
        label: line.component.name,
        value:
          line.component.calculation === "PERCENT_OF_BASE"
            ? `${Number(line.percent)}%`
            : `₹${Number(line.amount).toLocaleString("en-IN")}`,
      })),
    ],
  };
}
