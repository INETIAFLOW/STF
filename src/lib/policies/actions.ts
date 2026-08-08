"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { checkAccess } from "@/lib/authz/guard";
import { setPolicy } from "@/lib/policies";

/**
 * Tenant policy actions. Policies are configuration, not code
 * (Constitution §1). A change creates a NEW version and is audited with
 * before/after values; past records keep the version that applied to them.
 */

export type ActionResult =
  | { ok: true; message: string; detail?: string }
  | { ok: false; error: string };

const attendanceSchema = z.object({
  graceMinutes: z.number().int().min(0).max(120),
  radiusM: z.number().int().min(50).max(5000),
  requireReasonOutsideArea: z.boolean(),
});

export async function saveAttendancePolicyAction(
  input: z.input<typeof attendanceSchema>,
): Promise<ActionResult> {
  const parsed = attendanceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the attendance policy values." };
  }

  const { session, decision } = await checkAccess({
    module: "ATTENDANCE",
    permission: "policy.edit",
  });
  if (!decision.allowed) {
    return { ok: false, error: decision.message ?? "You don't have access to this." };
  }

  const db = getDb();
  const { version, previous } = await setPolicy(
    session.tenant.id,
    "attendance",
    parsed.data,
    session.user.id,
  );

  // Shift grace and branch radius are stored on their own records too, so
  // the policy and the operational rows stay in step.
  await db.shift.updateMany({
    where: { tenantId: session.tenant.id },
    data: { graceMinutes: parsed.data.graceMinutes },
  });
  await db.branch.updateMany({
    where: { tenantId: session.tenant.id },
    data: { radiusM: parsed.data.radiusM },
  });

  await recordAuditEvent(session, {
    action: "policy.attendance_changed",
    entityType: "tenant_policy",
    entityId: session.tenant.id,
    before: previous ?? undefined,
    after: { ...parsed.data, version },
  });

  revalidatePath("/admin/settings/attendance");

  return {
    ok: true,
    message: `Attendance policy saved as version ${version}.`,
    detail: "Records already saved keep the version that applied to them.",
  };
}

const payrollPolicySchema = z.object({
  latesPerDeductedDay: z.number().int().min(0).max(31),
  deductAbsentDays: z.boolean(),
});

export async function savePayrollPolicyAction(
  input: z.input<typeof payrollPolicySchema>,
): Promise<ActionResult> {
  const parsed = payrollPolicySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the payroll policy values." };
  }

  const { session, decision } = await checkAccess({
    module: "PAYROLL",
    permission: "policy.edit",
  });
  if (!decision.allowed) {
    return { ok: false, error: decision.message ?? "You don't have access to this." };
  }

  // An approved period must not have its rules changed underneath it.
  const approved = await getDb().payrollRun.count({
    where: { tenantId: session.tenant.id, status: "APPROVED" },
  });

  const { version, previous } = await setPolicy(
    session.tenant.id,
    "payroll",
    parsed.data,
    session.user.id,
  );

  await recordAuditEvent(session, {
    action: "policy.payroll_changed",
    entityType: "tenant_policy",
    entityId: session.tenant.id,
    before: previous ?? undefined,
    after: { ...parsed.data, version },
  });

  revalidatePath("/admin/settings/attendance");
  revalidatePath("/admin/payroll");

  return {
    ok: true,
    message: `Payroll policy saved as version ${version}.`,
    detail:
      approved > 0
        ? "Approved payroll periods keep the policy version they were calculated with."
        : undefined,
  };
}

const shiftSchema = z.object({
  shiftId: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name the shift.").max(80),
  startMinutes: z.number().int().min(0).max(1439),
  endMinutes: z.number().int().min(0).max(1439),
  graceMinutes: z.number().int().min(0).max(120),
});

export async function saveShiftAction(
  input: z.input<typeof shiftSchema>,
): Promise<ActionResult> {
  const parsed = shiftSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the shift details.",
    };
  }

  const { session, decision } = await checkAccess({
    module: "ATTENDANCE",
    permission: "policy.edit",
  });
  if (!decision.allowed) {
    return { ok: false, error: decision.message ?? "You don't have access to this." };
  }

  const db = getDb();
  const shift = parsed.data.shiftId
    ? await db.shift.update({
        where: { id: parsed.data.shiftId },
        data: {
          name: parsed.data.name,
          startMinutes: parsed.data.startMinutes,
          endMinutes: parsed.data.endMinutes,
          graceMinutes: parsed.data.graceMinutes,
        },
      })
    : await db.shift.create({
        data: {
          tenantId: session.tenant.id,
          name: parsed.data.name,
          startMinutes: parsed.data.startMinutes,
          endMinutes: parsed.data.endMinutes,
          graceMinutes: parsed.data.graceMinutes,
        },
      });

  await recordAuditEvent(session, {
    action: "policy.shift_saved",
    entityType: "shift",
    entityId: shift.id,
    after: {
      name: shift.name,
      start: shift.startMinutes,
      end: shift.endMinutes,
      grace: shift.graceMinutes,
    },
  });

  revalidatePath("/admin/settings/attendance");
  return { ok: true, message: `${shift.name} saved.` };
}
