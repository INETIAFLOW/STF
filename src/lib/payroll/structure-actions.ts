"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { checkAccess } from "@/lib/authz/guard";

/**
 * Salary components and per-employee structures.
 *
 * STF supplies no statutory formulas. A tenant defines its own components
 * — including anything their accountant requires — and marks those as
 * statutory so the UI can say plainly who defined them (D-019).
 */

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const componentSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers and underscores."),
  name: z.string().trim().min(1, "Name the component.").max(120),
  kind: z.enum(["EARNING", "DEDUCTION"]),
  calculation: z.enum(["FIXED", "PERCENT_OF_BASE", "PER_DAY"]),
  isStatutory: z.boolean().default(false),
  prorated: z.boolean().default(true),
});

export async function saveSalaryComponentAction(
  input: z.input<typeof componentSchema>,
): Promise<ActionResult> {
  const parsed = componentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the component details.",
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
  const count = await db.salaryComponent.count({
    where: { tenantId: session.tenant.id },
  });

  const component = await db.salaryComponent.upsert({
    where: {
      tenantId_key: { tenantId: session.tenant.id, key: parsed.data.key },
    },
    update: {
      name: parsed.data.name,
      kind: parsed.data.kind,
      calculation: parsed.data.calculation,
      isStatutory: parsed.data.isStatutory,
      prorated: parsed.data.prorated,
    },
    create: {
      tenantId: session.tenant.id,
      key: parsed.data.key,
      name: parsed.data.name,
      kind: parsed.data.kind,
      calculation: parsed.data.calculation,
      isStatutory: parsed.data.isStatutory,
      prorated: parsed.data.prorated,
      sortOrder: (count + 1) * 10,
    },
  });

  await recordAuditEvent(session, {
    action: "payroll.component_saved",
    entityType: "salary_component",
    entityId: component.id,
    after: { key: component.key, name: component.name, kind: component.kind },
  });

  revalidatePath("/admin/payroll/structures");
  return { ok: true, message: `${component.name} saved.` };
}

const structureSchema = z.object({
  membershipId: z.string().uuid(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  baseAmount: z.number().nonnegative(),
  note: z.string().trim().max(500).optional(),
  lines: z
    .array(
      z.object({
        componentId: z.string().uuid(),
        amount: z.number().nonnegative().default(0),
        percent: z.number().min(0).max(100).default(0),
      }),
    )
    .min(1, "Add at least one component."),
});

export async function saveSalaryStructureAction(
  input: z.input<typeof structureSchema>,
): Promise<ActionResult> {
  const parsed = structureSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the salary structure.",
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
  const member = await db.tenantMembership.findFirst({
    where: {
      id: parsed.data.membershipId,
      tenantId: session.tenant.id, // tenant isolation
    },
    include: { user: true },
  });
  if (!member) return { ok: false, error: "That employee is no longer available." };

  const effectiveFrom = new Date(`${parsed.data.effectiveFrom}T00:00:00.000Z`);

  // A structure for an already-approved period must not be rewritten.
  const lockedRun = await db.payrollRun.findFirst({
    where: {
      tenantId: session.tenant.id,
      status: "APPROVED",
      periodMonth: { gte: effectiveFrom },
    },
    orderBy: { periodMonth: "asc" },
  });
  if (lockedRun) {
    return {
      ok: false,
      error:
        "Payroll for that period is approved and locked. Choose a later effective date, or use an adjustment.",
    };
  }

  const previous = await db.salaryStructure.findFirst({
    where: {
      tenantId: session.tenant.id,
      membershipId: member.id,
    },
    orderBy: { effectiveFrom: "desc" },
    include: { lines: true },
  });

  const structure = await db.salaryStructure.upsert({
    where: {
      tenantId_membershipId_effectiveFrom: {
        tenantId: session.tenant.id,
        membershipId: member.id,
        effectiveFrom,
      },
    },
    update: {
      baseAmount: parsed.data.baseAmount,
      note: parsed.data.note,
      lines: {
        deleteMany: {},
        create: parsed.data.lines.map((line) => ({
          componentId: line.componentId,
          amount: line.amount,
          percent: line.percent,
        })),
      },
    },
    create: {
      tenantId: session.tenant.id,
      membershipId: member.id,
      effectiveFrom,
      baseAmount: parsed.data.baseAmount,
      note: parsed.data.note,
      createdById: session.user.id,
      lines: {
        create: parsed.data.lines.map((line) => ({
          componentId: line.componentId,
          amount: line.amount,
          percent: line.percent,
        })),
      },
    },
  });

  await recordAuditEvent(session, {
    action: "payroll.structure_saved",
    entityType: "salary_structure",
    entityId: structure.id,
    before: previous
      ? {
          effectiveFrom: previous.effectiveFrom.toISOString().slice(0, 10),
          baseAmount: Number(previous.baseAmount),
        }
      : undefined,
    after: {
      employee: member.user.displayName,
      effectiveFrom: parsed.data.effectiveFrom,
      baseAmount: parsed.data.baseAmount,
      components: parsed.data.lines.length,
    },
  });

  revalidatePath("/admin/payroll/structures");
  revalidatePath("/admin/payroll");

  return {
    ok: true,
    message: `Salary structure saved for ${member.user.displayName}.`,
  };
}
