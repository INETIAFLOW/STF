import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { PERMISSIONS, ROLE_TEMPLATES } from "@/lib/catalog";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";

export const metadata: Metadata = { title: "Roles & permissions" };

/**
 * Roles & permissions shell (screen A19). Templates and the permission
 * catalog are real; editing opens in a later phase together with the
 * live-impact warning flow ("You are about to change what N people can
 * see…") required by the design.
 */
export default async function RolesPage() {
  const { decision } = await checkAccess({
    module: "EMPLOYEES",
    permission: "roles.manage",
  });
  if (!decision.allowed) redirect("/unauthorized");

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-h1 text-text-primary">
        Roles &amp; permissions
      </h1>

      <Alert variant="info" title="Record scope">
        Scope is applied before every permission below. Role editing, record
        scope and per-person exceptions open in a later build phase, with
        impact warnings and audit.
      </Alert>

      <div className="grid gap-4 xl:grid-cols-2">
        {ROLE_TEMPLATES.map((role) => (
          <Card key={role.key} className="flex flex-col gap-3">
            <div>
              <h2 className="font-heading text-h3 text-text-primary">
                {role.name}
              </h2>
              <p className="mt-0.5 text-secondary text-text-secondary">
                {role.description}
              </p>
            </div>

            {role.permissions.length === 0 ? (
              <p className="text-secondary text-text-secondary">
                No admin permissions. Acts on own records only.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {role.permissions.map((permKey) => {
                  const perm = PERMISSIONS.find((p) => p.key === permKey)!;
                  return (
                    <li key={permKey}>
                      <span
                        className={
                          perm.isSensitive
                            ? "inline-flex h-6 items-center gap-1 rounded-chip bg-status-warning-bg px-2 text-[12px] font-semibold text-status-warning-text"
                            : "inline-flex h-6 items-center rounded-chip bg-surface-sunken px-2 text-[12px] font-semibold text-text-secondary"
                        }
                      >
                        {perm.name}
                        {perm.isSensitive && (
                          <span className="font-normal"> · Sensitive</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-auto border-t border-border-subtle pt-2">
              <StatusChip
                status={{
                  key: "template",
                  label: "System template",
                  tone: "neutral",
                }}
                size="sm"
                dot={false}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
