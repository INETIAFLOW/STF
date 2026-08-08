/**
 * STF seed — platform catalog + one fictional demo tenant for local
 * development. Every name here is a placeholder; no real company or
 * employee may ever be hardcoded (Phase 1 brief).
 *
 * Idempotent: safe to run repeatedly (upserts keyed on stable unique keys).
 * Run with: npm run db:seed
 */
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnv({ path: [".env.local", ".env"], quiet: true });
import {
  DEFAULT_ENABLED_MODULES,
  FEATURES,
  MODULES,
  MODULE_DEPENDENCIES,
  PERMISSIONS,
  ROLE_TEMPLATES,
} from "../src/lib/catalog";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL / DIRECT_URL is not set. See SETUP.md.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  // ---------------------------------------------------------- catalog
  const moduleIdByKey = new Map<string, string>();
  for (const def of Object.values(MODULES)) {
    const m = await prisma.module.upsert({
      where: { key: def.key },
      update: {
        name: def.name,
        description: def.description,
        category: def.category,
        sortOrder: def.sortOrder,
      },
      create: {
        key: def.key,
        name: def.name,
        description: def.description,
        category: def.category,
        sortOrder: def.sortOrder,
      },
    });
    moduleIdByKey.set(def.key, m.id);
  }

  for (const dep of MODULE_DEPENDENCIES) {
    await prisma.moduleDependency.upsert({
      where: {
        moduleId_requiresModuleId: {
          moduleId: moduleIdByKey.get(dep.module)!,
          requiresModuleId: moduleIdByKey.get(dep.requires)!,
        },
      },
      update: { anyOfGroup: dep.anyOfGroup ?? null },
      create: {
        moduleId: moduleIdByKey.get(dep.module)!,
        requiresModuleId: moduleIdByKey.get(dep.requires)!,
        anyOfGroup: dep.anyOfGroup ?? null,
      },
    });
  }

  const featureIdByKey = new Map<string, string>();
  for (const f of FEATURES) {
    const moduleId = moduleIdByKey.get(f.module)!;
    const feature = await prisma.feature.upsert({
      where: { moduleId_key: { moduleId, key: f.key } },
      update: { name: f.name, defaultEnabled: f.defaultEnabled },
      create: {
        moduleId,
        key: f.key,
        name: f.name,
        defaultEnabled: f.defaultEnabled,
      },
    });
    featureIdByKey.set(`${f.module}.${f.key}`, feature.id);
  }

  const permissionIdByKey = new Map<string, string>();
  for (const p of PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { key: p.key },
      update: { name: p.name, isSensitive: p.isSensitive },
      create: { key: p.key, name: p.name, isSensitive: p.isSensitive },
    });
    permissionIdByKey.set(p.key, perm.id);
  }

  // ------------------------------------------------- fictional demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-co" },
    update: {},
    create: {
      slug: "demo-co",
      name: "Demo Trading Co. (placeholder)",
      timezone: "Asia/Kolkata",
    },
  });

  const roleIdByKey = new Map<string, string>();
  for (const tpl of ROLE_TEMPLATES) {
    const role = await prisma.role.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: tpl.key } },
      update: { name: tpl.name, description: tpl.description, isSystem: true },
      create: {
        tenantId: tenant.id,
        key: tpl.key,
        name: tpl.name,
        description: tpl.description,
        isSystem: true,
      },
    });
    roleIdByKey.set(tpl.key, role.id);

    for (const permKey of tpl.permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permissionIdByKey.get(permKey)!,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permissionIdByKey.get(permKey)!,
        },
      });
    }
  }

  // Module entitlements: V1 defaults on, optional modules off.
  for (const def of Object.values(MODULES)) {
    const enabled =
      def.category === "CORE" ||
      DEFAULT_ENABLED_MODULES.includes(def.key as never);
    await prisma.tenantModuleSetting.upsert({
      where: {
        tenantId_moduleId: {
          tenantId: tenant.id,
          moduleId: moduleIdByKey.get(def.key)!,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        moduleId: moduleIdByKey.get(def.key)!,
        enabled,
      },
    });
  }

  // Feature settings from catalog defaults.
  for (const f of FEATURES) {
    await prisma.tenantFeatureSetting.upsert({
      where: {
        tenantId_featureId: {
          tenantId: tenant.id,
          featureId: featureIdByKey.get(`${f.module}.${f.key}`)!,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        featureId: featureIdByKey.get(`${f.module}.${f.key}`)!,
        enabled: f.defaultEnabled,
      },
    });
  }

  // A default branch and shift so attendance has policy to evaluate.
  // Coordinates are a placeholder location, not a real address.
  const existingBranch = await prisma.branch.findFirst({
    where: { tenantId: tenant.id, name: "Main branch (placeholder)" },
  });
  const branch =
    existingBranch ??
    (await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: "Main branch (placeholder)",
        address: "Placeholder address",
        lat: 19.076,
        lng: 72.8777,
        radiusM: 300,
      },
    }));

  // A second location so multi-location behaviour is exercisable. Its
  // permitted area is deliberately larger than the company default — a
  // warehouse yard needs more room than a shop counter.
  const existingSecond = await prisma.branch.findFirst({
    where: { tenantId: tenant.id, name: "Warehouse (placeholder)" },
  });
  if (!existingSecond) {
    await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: "Warehouse (placeholder)",
        address: "Placeholder address 2",
        lat: 19.1,
        lng: 72.9,
        radiusM: 500,
      },
    });
  }

  const existingShift = await prisma.shift.findFirst({
    where: { tenantId: tenant.id, isDefault: true },
  });
  const shift =
    existingShift ??
    (await prisma.shift.create({
      data: {
        tenantId: tenant.id,
        name: "General shift",
        startMinutes: 9 * 60 + 30, // 09:30
        endMinutes: 18 * 60 + 30, // 18:30
        graceMinutes: 10,
        isDefault: true,
      },
    }));

  // Placeholder people. authUserId stays null until a Supabase account is
  // linked (see SECURITY-NOTES.md — linking policy).
  const people: Array<{
    email: string;
    displayName: string;
    role: string;
    employeeCode?: string;
  }> = [
    { email: "dev.owner@example.com", displayName: "Dev Owner (placeholder)", role: "OWNER" },
    { email: "dev.admin@example.com", displayName: "Dev Admin (placeholder)", role: "ADMIN" },
    { email: "dev.hr@example.com", displayName: "Dev HR (placeholder)", role: "HR" },
    {
      email: "dev.employee@example.com",
      displayName: "Dev Employee (placeholder)",
      role: "EMPLOYEE",
      employeeCode: "EMP-0001",
    },
  ];

  for (const person of people) {
    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: { displayName: person.displayName },
      create: { email: person.email, displayName: person.displayName },
    });
    await prisma.tenantMembership.upsert({
      where: {
        tenantId_userId: { tenantId: tenant.id, userId: user.id },
      },
      update: {
        roleId: roleIdByKey.get(person.role)!,
        branchId: branch.id,
        shiftId: shift.id,
      },
      create: {
        tenantId: tenant.id,
        userId: user.id,
        roleId: roleIdByKey.get(person.role)!,
        employeeCode: person.employeeCode,
        branchId: branch.id,
        shiftId: shift.id,
      },
    });
  }

  // Any membership created outside the seed (e.g. provision-user.ts) also
  // needs a branch and shift so attendance policy resolves.
  await prisma.tenantMembership.updateMany({
    where: { tenantId: tenant.id, branchId: null },
    data: { branchId: branch.id, shiftId: shift.id },
  });

  // One placeholder person is marked as working across locations, so the
  // roaming path can be tried without editing data by hand.
  const roamingUser = await prisma.user.findUnique({
    where: { email: "dev.employee@example.com" },
  });
  if (roamingUser) {
    await prisma.tenantMembership.updateMany({
      where: { tenantId: tenant.id, userId: roamingUser.id },
      data: { canCheckInAtAnyBranch: true },
    });
  }

  await prisma.auditEvent.create({
    data: {
      tenantId: tenant.id,
      actorType: "SYSTEM",
      action: "platform.seeded",
      entityType: "tenant",
      entityId: tenant.id,
      metadata: { note: "Development seed — placeholder data only." },
    },
  });

  console.log(
    `Seeded: ${moduleIdByKey.size} modules, ${featureIdByKey.size} features, ` +
      `${permissionIdByKey.size} permissions, tenant "demo-co" with ` +
      `${ROLE_TEMPLATES.length} roles and ${people.length} placeholder users.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
