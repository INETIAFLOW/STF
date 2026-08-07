import "server-only";

import { redirect } from "next/navigation";
import type { ModuleKey, PermissionKey } from "@/lib/catalog";
import { getAppSession } from "@/lib/auth/session";
import type { AppSession } from "@/lib/auth/types";
import { loadEntitlements } from "./entitlements";
import { evaluateAccess, type AccessDecision } from "./flags";

/**
 * Server-side route and action guards. These are the enforcement layer —
 * navigation only *reflects* these decisions, it never replaces them
 * (Product Constitution §5).
 */

/** Require a signed-in, tenant-resolved session or redirect to sign-in. */
export async function requireSession(): Promise<AppSession> {
  const session = await getAppSession();
  if (!session) redirect("/sign-in");
  return session;
}

/** Require the admin area entry permission or show the unauthorized state. */
export async function requireAdminArea(): Promise<AppSession> {
  const session = await requireSession();
  if (!session.permissions.has("admin.access")) redirect("/unauthorized");
  return session;
}

/**
 * Evaluate module/feature/permission access for the current request.
 * Returns the decision — callers choose redirect, 403 response, or
 * in-place explanation (module-disabled empty state).
 */
export async function checkAccess(input: {
  module: ModuleKey;
  feature?: string;
  permission?: PermissionKey;
}): Promise<{ session: AppSession; decision: AccessDecision }> {
  const session = await requireSession();
  const entitlements = await loadEntitlements(
    session.tenant.id,
    session.user.id,
  );
  const decision = evaluateAccess({ session, entitlements, ...input });
  return { session, decision };
}

/** Guard a page: redirect to the unauthorized state when denied. */
export async function requireAccess(input: {
  module: ModuleKey;
  feature?: string;
  permission?: PermissionKey;
}): Promise<AppSession> {
  const { session, decision } = await checkAccess(input);
  if (!decision.allowed) redirect("/unauthorized");
  return session;
}

export function hasPermission(
  session: AppSession,
  permission: PermissionKey,
): boolean {
  return session.permissions.has(permission);
}
