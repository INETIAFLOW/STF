"use client";

import { Switch } from "@/components/ui/Switch";

/**
 * Governed switch rendering for Module Management (Phase 1: read-only).
 * The switch shows its true server-backed state as a word; changing it is
 * locked until the impact-confirm + audit flow ships (Constitution §5 —
 * a governed switch must never flip without server confirmation).
 */
export function ModuleSwitch({
  label,
  enabled,
  core = false,
  compact = false,
}: {
  label: string;
  enabled: boolean;
  core?: boolean;
  compact?: boolean;
}) {
  return (
    <Switch
      checked={enabled}
      label={label}
      locked
      disabledReason={
        core
          ? "Core platform capability — always on."
          : "Module changes open in a later build phase, with impact confirmation and audit."
      }
      className={compact ? "min-h-11 py-1" : undefined}
    />
  );
}
