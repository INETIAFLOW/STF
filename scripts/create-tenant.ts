/**
 * Create a real company and its owner.
 *
 * `scripts/provision-user.ts` only ever attaches people to the seeded demo
 * tenant, which is fine for development and useless for onboarding a
 * customer. This creates the tenant itself: roles with their permissions,
 * module and feature entitlements from the catalog, the owner's
 * membership, and an invitation link the owner opens to set their OWN
 * password.
 *
 * Nobody's password is set here, and no Supabase secret key is needed —
 * the accept flow creates the auth account when the invitation is
 * redeemed. That means this script cannot leak a credential, and the owner
 * is onboarded through exactly the flow their staff will use.
 *
 * Usage:
 *   npx tsx scripts/create-tenant.ts \
 *     --name "Acme Hardware" \
 *     --owner-email owner@acme.example \
 *     --owner-name "Priya Shah" \
 *     [--slug acme-hardware] [--timezone Asia/Kolkata] [--dry-run]
 */
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  DEFAULT_ENABLED_MODULES,
  FEATURES,
  MODULES,
  PERMISSIONS,
  ROLE_TEMPLATES,
} from "../src/lib/catalog";
import {
  generateInviteToken,
  hashInviteToken,
  inviteExpiryFrom,
  inviteUrl,
} from "../src/lib/invites/token";
import { normaliseEmail } from "../src/lib/invites/policy";

loadEnv({ path: [".env.local", ".env"], quiet: true });

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(`--${flag}`);
  return i === -1 ? undefined : process.argv[i + 1];
}
const dryRun = process.argv.includes("--dry-run");

const nameArg = arg("name");
const ownerEmailRaw = arg("owner-email");
const ownerNameArg = arg("owner-name");
const timezone = arg("timezone") ?? "Asia/Kolkata";
const origin = arg("origin") ?? "https://stf.inetiaflow.com";

if (!nameArg || !ownerEmailRaw || !ownerNameArg) {
  console.error(
    "Required: --name <company> --owner-email <email> --owner-name <person>\n" +
      "Optional: --slug --timezone (default Asia/Kolkata) --origin --dry-run",
  );
  process.exit(1);
}

const name: string = nameArg;
const ownerName: string = ownerNameArg;

const slug =
  arg("slug") ??
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const ownerEmail = normaliseEmail(ownerEmailRaw);

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  }),
});

async function main() {
  // ---- refuse to clobber ------------------------------------------------
  const existingTenant = await db.tenant.findUnique({ where: { slug } });
  if (existingTenant) {
    throw new Error(
      `A company with slug "${slug}" already exists (${existingTenant.name}). ` +
        `Pass a different --slug, or use the app to edit it.`,
    );
  }
  const existingUser = await db.user.findUnique({
    where: { email: ownerEmail },
    include: { memberships: { include: { tenant: true } } },
  });
  if (existingUser && existingUser.memberships.length > 0) {
    // Reusing one login across companies is legitimate; silently doing it
    // is not.
    console.warn(
      `NOTE: ${ownerEmail} already belongs to ${existingUser.memberships.length} company/companies. ` +
        `They will be added to this one as well.`,
    );
  }

  console.log(`Company : ${name}  (slug ${slug}, ${timezone})`);
  console.log(`Owner   : ${ownerName} <${ownerEmail}>`);
  if (dryRun) {
    console.log("\n--dry-run: nothing written.");
    return;
  }

  // The platform catalog must already be seeded (npm run db:seed).
  const permissionIdByKey = new Map<string, string>();
  for (const p of PERMISSIONS) {
    const row = await db.permission.findUnique({ where: { key: p.key } });
    if (!row) {
      throw new Error(
        `Permission "${p.key}" is missing. Run: npx prisma db seed`,
      );
    }
    permissionIdByKey.set(p.key, row.id);
  }
  const moduleIdByKey = new Map<string, string>();
  for (const key of Object.keys(MODULES)) {
    const row = await db.module.findUnique({ where: { key } });
    if (!row) throw new Error(`Module "${key}" is missing. Run: npx prisma db seed`);
    moduleIdByKey.set(key, row.id);
  }

  const result = await db.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { slug, name, timezone, status: "ACTIVE" },
    });

    // Roles, with their template permissions.
    let ownerRoleId: string | null = null;
    for (const tpl of ROLE_TEMPLATES) {
      const role = await tx.role.create({
        data: {
          tenantId: tenant.id,
          key: tpl.key,
          name: tpl.name,
          description: tpl.description,
          isSystem: true,
        },
      });
      if (tpl.key === "OWNER") ownerRoleId = role.id;
      if (tpl.permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: tpl.permissions.map((k) => ({
            roleId: role.id,
            permissionId: permissionIdByKey.get(k)!,
          })),
        });
      }
    }
    if (!ownerRoleId) throw new Error("No OWNER role template in the catalog.");

    // Module entitlements: V1 defaults on, optional modules off.
    await tx.tenantModuleSetting.createMany({
      data: Object.values(MODULES).map((m) => ({
        tenantId: tenant.id,
        moduleId: moduleIdByKey.get(m.key)!,
        enabled: (DEFAULT_ENABLED_MODULES as string[]).includes(m.key),
      })),
    });

    // Feature flags at their documented defaults.
    for (const f of FEATURES) {
      const feature = await tx.feature.findFirst({
        where: { key: f.key, module: { key: f.module } },
      });
      if (!feature) continue;
      await tx.tenantFeatureSetting.create({
        data: { tenantId: tenant.id, featureId: feature.id, enabled: f.defaultEnabled },
      });
    }

    // The owner. INVITED until they set a password.
    const user = existingUser
      ? await tx.user.update({
          where: { id: existingUser.id },
          data: { displayName: existingUser.displayName || ownerName },
        })
      : await tx.user.create({
          data: { email: ownerEmail, displayName: ownerName, status: "INVITED" },
        });

    const membership = await tx.tenantMembership.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        roleId: ownerRoleId,
        status: "INVITED",
        employmentType: "FULL_TIME",
      },
    });

    const token = generateInviteToken();
    const now = new Date();
    await tx.employeeInvite.create({
      data: {
        tenantId: tenant.id,
        membershipId: membership.id,
        tokenHash: hashInviteToken(token),
        channel: "EMAIL",
        status: "PENDING",
        sentToEmail: ownerEmail,
        expiresAt: inviteExpiryFrom(now),
        sentAt: now,
      },
    });

    await tx.auditEvent.create({
      data: {
        tenantId: tenant.id,
        actorType: "SYSTEM",
        action: "tenant.created",
        entityType: "tenant",
        entityId: tenant.id,
        metadata: { name, slug, timezone, owner: ownerEmail, via: "scripts/create-tenant.ts" },
      },
    });

    return { tenant, membership, token };
  });

  console.log(`\nCreated. Send this link to ${ownerName} — it works once, for 7 days:\n`);
  console.log(`  ${inviteUrl(origin, result.token)}\n`);
  console.log("They choose their own password on that page. Nobody else sees it.");
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`ERROR: ${message.replace(/postgres(ql)?:\/\/\S*/gi, "[redacted]")}`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
