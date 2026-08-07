import "server-only";

import {
  DEFAULT_ENABLED_MODULES,
  FEATURES,
  MODULES,
  ROLE_TEMPLATES,
} from "@/lib/catalog";
import type { AppSession, TenantEntitlements } from "./types";

/**
 * Dev preview session ("fixture mode").
 *
 * Lets the application shell render with clearly-labelled placeholder data
 * when no Supabase session or database is configured — local preview and
 * UI review only. Guarded twice: the env flag AND NODE_ENV=development.
 * See SECURITY-NOTES.md. Never enable outside a developer machine.
 */
export function devFixtureRole(): string | null {
  if (process.env.NODE_ENV !== "development") return null;
  const value = process.env.STF_DEV_FAKE_SESSION?.trim().toUpperCase();
  if (!value) return null;
  const allowed = ["EMPLOYEE", "OWNER", "ADMIN", "HR", "MANAGER"];
  return allowed.includes(value) ? value : "EMPLOYEE";
}

const FIXTURE_TENANT = {
  id: "00000000-0000-4000-8000-00000000dead",
  slug: "demo-co",
  name: "Demo Trading Co. (placeholder)",
  timezone: "Asia/Kolkata",
} as const;

export function fixtureSession(roleKey: string): AppSession {
  const template =
    ROLE_TEMPLATES.find((r) => r.key === roleKey) ??
    ROLE_TEMPLATES.find((r) => r.key === "EMPLOYEE")!;

  return {
    user: {
      id: "00000000-0000-4000-8000-0000000000f1",
      displayName:
        template.key === "EMPLOYEE"
          ? "Dev Employee (placeholder)"
          : `Dev ${template.name} (placeholder)`,
      email: `dev.${template.key.toLowerCase()}@example.com`,
      isPlatformAdmin: false,
    },
    tenant: { ...FIXTURE_TENANT },
    membership: {
      id: "00000000-0000-4000-8000-0000000000b1",
      roleKey: template.key,
      roleName: template.name,
      employeeCode: template.key === "EMPLOYEE" ? "EMP-0001" : null,
    },
    permissions: new Set(template.permissions),
    source: "dev-fixture",
  };
}

/** Entitlements mirroring the seed defaults. */
export function fixtureEntitlements(): TenantEntitlements {
  const modules: TenantEntitlements["modules"] = {};
  for (const def of Object.values(MODULES)) {
    modules[def.key] =
      def.category === "CORE" ||
      DEFAULT_ENABLED_MODULES.includes(def.key as never);
  }
  const features: TenantEntitlements["features"] = {};
  for (const f of FEATURES) {
    features[`${f.module}.${f.key}`] = { enabled: f.defaultEnabled };
  }
  return { modules, features, userExceptions: {} };
}
