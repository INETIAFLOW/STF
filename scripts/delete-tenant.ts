/**
 * Delete a company and everything belonging to it.
 *
 * Written for one specific job — removing the seeded demo tenant from a
 * production database before a real customer arrives — but it works for
 * any tenant, which is exactly why it is careful:
 *
 * - Requires the slug AND `--confirm <slug>` typed again. A single
 *   mistyped flag should not destroy a customer.
 * - Prints the full inventory and makes you look at it before writing.
 * - Deletes strictly within one tenant, child rows first, in a
 *   transaction. It cannot half-delete.
 * - Refuses if the tenant is not the one you named.
 *
 * This is genuinely destructive. The demo tenant is reversible with
 * `npx prisma db seed`; a real one is not.
 *
 * Usage:
 *   npx tsx scripts/delete-tenant.ts --slug demo-co            (dry run)
 *   npx tsx scripts/delete-tenant.ts --slug demo-co --confirm demo-co
 */
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnv({ path: [".env.local", ".env"], quiet: true });

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(`--${flag}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const slug = arg("slug");
const confirm = arg("confirm");

if (!slug) {
  console.error("Required: --slug <tenant-slug>   (add --confirm <slug> to actually delete)");
  process.exit(1);
}

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  }),
});

async function main() {
  const tenant = await db.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new Error(`No company with slug "${slug}".`);

  const t = { tenantId: tenant.id };
  const counts = {
    memberships: await db.tenantMembership.count({ where: t }),
    attendance: await db.attendanceRecord.count({ where: t }),
    leave: await db.leaveRequest.count({ where: t }),
    tasks: await db.task.count({ where: t }),
    invites: await db.employeeInvite.count({ where: t }),
    departments: await db.department.count({ where: t }),
    branches: await db.branch.count({ where: t }),
    payrollRuns: await db.payrollRun.count({ where: t }),
    documents: await db.employeeDocument.count({ where: t }),
    notifications: await db.notification.count({ where: t }),
    auditEvents: await db.auditEvent.count({ where: t }),
  };

  console.log(`Company: ${tenant.name}  (slug ${tenant.slug})`);
  for (const [k, v] of Object.entries(counts)) {
    if (v > 0) console.log(`  ${k.padEnd(14)} ${v}`);
  }

  if (confirm !== slug) {
    console.log(
      `\nDRY RUN — nothing deleted.\nTo delete, re-run with:  --slug ${slug} --confirm ${slug}`,
    );
    return;
  }

  const memberships = await db.tenantMembership.findMany({
    where: t,
    select: { id: true, userId: true },
  });
  const membershipIds = memberships.map((m) => m.id);
  const userIds = memberships.map((m) => m.userId);

  await db.$transaction(async (tx) => {
    // Children first. Every delete is tenant-scoped; nothing here can
    // reach another company's rows.
    await tx.actionRequestRecipient.deleteMany({ where: t });
    await tx.actionRequest.deleteMany({ where: t });
    await tx.proofFile.deleteMany({ where: { proof: { tenantId: tenant.id } } });
    await tx.taskProof.deleteMany({ where: t });
    await tx.task.deleteMany({ where: t });
    await tx.leaveRequest.deleteMany({ where: t });
    await tx.attendanceRecord.deleteMany({ where: t });
    await tx.employeeDocument.deleteMany({ where: t });
    await tx.payrollAdjustment.deleteMany({ where: { line: { tenantId: tenant.id } } });
    await tx.payrollLine.deleteMany({ where: t });
    await tx.payrollRun.deleteMany({ where: t });
    await tx.salaryStructureLine.deleteMany({ where: { structure: { tenantId: tenant.id } } });
    await tx.salaryStructure.deleteMany({ where: t });
    await tx.salaryComponent.deleteMany({ where: t });
    await tx.employeeInvite.deleteMany({ where: t });
    await tx.notification.deleteMany({ where: t });
    await tx.userFeatureException.deleteMany({ where: t });
    await tx.tenantFeatureSetting.deleteMany({ where: t });
    await tx.tenantModuleSetting.deleteMany({ where: t });
    await tx.tenantPolicy.deleteMany({ where: t });

    // Departments point at memberships and vice versa — break both links
    // before removing either.
    await tx.department.updateMany({ where: t, data: { headId: null } });
    await tx.tenantMembership.updateMany({
      where: t,
      data: { departmentId: null, reportingToId: null, branchId: null, shiftId: null },
    });
    await tx.department.deleteMany({ where: t });
    await tx.tenantMembership.deleteMany({ where: t });
    await tx.branch.deleteMany({ where: t });
    await tx.shift.deleteMany({ where: t });

    await tx.rolePermission.deleteMany({ where: { role: { tenantId: tenant.id } } });
    await tx.role.deleteMany({ where: t });
    await tx.auditEvent.deleteMany({ where: t });
    await tx.tenant.delete({ where: { id: tenant.id } });

    // Users are platform-level and may belong to other companies. Remove
    // only those left with no membership anywhere.
    for (const userId of userIds) {
      const remaining = await tx.tenantMembership.count({ where: { userId } });
      if (remaining === 0) await tx.user.delete({ where: { id: userId } });
    }
  });

  console.log(`\nDeleted ${tenant.name} and ${membershipIds.length} membership(s).`);
  console.log("Orphaned logins removed; logins shared with another company kept.");
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`ERROR: ${message.replace(/postgres(ql)?:\/\/\S*/gi, "[redacted]")}`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
