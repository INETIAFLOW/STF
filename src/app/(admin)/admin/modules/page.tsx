import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { loadEntitlements } from "@/lib/authz/entitlements";
import {
  FEATURES,
  MODULES,
  MODULE_DEPENDENCIES,
  type ModuleKey,
} from "@/lib/catalog";
import { STATUS } from "@/lib/status";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { ModuleSwitch } from "./ModuleSwitch";

export const metadata: Metadata = { title: "Module Management" };

/**
 * Module Management shell (screen A20/A21). Cards, feature controls,
 * dependency lines and switch states are real and driven by the tenant's
 * entitlements. Toggling is deliberately read-only in Phase 1 — governed
 * switches must never flip without the full impact-confirm flow, which
 * ships with the module toggle actions in a later phase.
 */
export default async function ModuleManagementPage() {
  const { session, decision } = await checkAccess({
    module: "EMPLOYEES", // module mgmt itself is platform UI; gate on permission
    permission: "modules.manage",
  });
  if (!decision.allowed) redirect("/unauthorized");

  const entitlements = await loadEntitlements(
    session.tenant.id,
    session.user.id,
  );

  const dependencyLine = (key: ModuleKey): string | null => {
    const deps = MODULE_DEPENDENCIES.filter((d) => d.module === key);
    if (deps.length === 0) return null;
    const all = deps.filter((d) => !d.anyOfGroup).map((d) => MODULES[d.requires].name);
    const any = deps.filter((d) => d.anyOfGroup).map((d) => MODULES[d.requires].name);
    const parts: string[] = [];
    if (all.length) parts.push(all.join(" and "));
    if (any.length) parts.push(any.join(" or "));
    return `Requires ${parts.join(", and ")}`;
  };

  const isEnabled = (key: ModuleKey) =>
    MODULES[key].category === "CORE" || entitlements.modules[key] === true;

  const groups = [
    {
      title: "V1 modules",
      modules: Object.values(MODULES).filter((m) => m.category !== "OPTIONAL"),
    },
    {
      title: "Optional modules",
      modules: Object.values(MODULES).filter((m) => m.category === "OPTIONAL"),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-h1 text-text-primary">
        Module Management
      </h1>

      <Alert variant="info" title="How module changes behave">
        Turning a module off removes it from navigation, blocks it in the
        app, stops its notifications and scheduled jobs, and is recorded in
        the activity log. No business data is deleted.
      </Alert>

      {groups.map((group) => (
        <section key={group.title} aria-label={group.title}>
          <h2 className="mb-3 font-heading text-h2 text-text-primary">
            {group.title}
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {group.modules.map((moduleDef) => {
              const enabled = isEnabled(moduleDef.key);
              const optionalUnavailable =
                moduleDef.category === "OPTIONAL" && !enabled;
              const features = FEATURES.filter(
                (f) => f.module === moduleDef.key,
              );
              const deps = dependencyLine(moduleDef.key);

              return (
                <Card key={moduleDef.key} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-h3 text-text-primary">
                        {moduleDef.name}
                      </h3>
                      <p className="mt-0.5 text-secondary text-text-secondary">
                        {moduleDef.description}
                      </p>
                    </div>
                    <StatusChip
                      status={
                        optionalUnavailable
                          ? STATUS.notAvailable
                          : enabled
                            ? STATUS.enabled
                            : STATUS.disabled
                      }
                      size="sm"
                    />
                  </div>

                  {deps && (
                    <p className="text-caption text-text-secondary">{deps}</p>
                  )}

                  {optionalUnavailable ? (
                    <p className="text-secondary text-text-secondary">
                      Ask your STF contact to enable this after its rules are
                      approved.
                    </p>
                  ) : (
                    <ModuleSwitch
                      label={`${moduleDef.name} module`}
                      enabled={enabled}
                      core={moduleDef.category === "CORE"}
                    />
                  )}

                  {enabled && features.length > 0 && (
                    <div className="border-t border-border-subtle pt-3">
                      <p className="micro-label mb-1 text-text-tertiary">
                        Feature controls
                      </p>
                      <ul className="flex flex-col">
                        {features.map((feature) => {
                          const setting =
                            entitlements.features[
                              `${feature.module}.${feature.key}`
                            ];
                          const featureOn = setting
                            ? setting.enabled
                            : feature.defaultEnabled;
                          return (
                            <li key={feature.key}>
                              <ModuleSwitch
                                label={feature.name}
                                enabled={featureOn}
                                compact
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
