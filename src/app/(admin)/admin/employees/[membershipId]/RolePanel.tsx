"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { TextArea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { changeEmployeeRoleAction } from "@/lib/employees/actions";

export interface RoleOption {
  value: string;
  label: string;
  consequence: string;
  /** Above the signed-in person's own authority — offered but refused. */
  aboveYou: boolean;
}

/**
 * Change what someone is allowed to do.
 *
 * Its own card rather than a field in the profile form, because it is the
 * only setting here that changes what a person can SEE. Grouping it with
 * "designation" would make a permission grant look like a label edit.
 *
 * The consequence is shown before the control is pressed, and again in the
 * confirmation, because "HR" means nothing to an SME owner and "can view
 * salary amounts" means a great deal.
 */
export function RolePanel({
  membershipId,
  employeeName,
  currentRoleId,
  currentRoleName,
  roles,
  canManage,
  isSelf,
}: {
  membershipId: string;
  employeeName: string;
  currentRoleId: string;
  currentRoleName: string;
  roles: RoleOption[];
  canManage: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [roleId, setRoleId] = useState(currentRoleId);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = roles.find((r) => r.value === roleId);
  const changed = roleId !== currentRoleId;

  const firstName = employeeName.trim().split(/\s+/)[0];

  return (
    <Card>
      <div className="flex items-start gap-3">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-text-secondary"
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-h3 text-text-primary">
            What they can do
          </h2>
          <p className="mt-1 text-secondary text-text-secondary">
            Currently <strong className="text-text-primary">{currentRoleName}</strong>.
          </p>

          {isSelf ? (
            <div className="mt-4">
              <Alert variant="info" title="This is your own account">
                You can&apos;t change your own role. Ask another owner or admin
                to do it — that way the change is always someone else&apos;s
                decision, on the record.
              </Alert>
            </div>
          ) : !canManage ? (
            <p className="mt-4 text-secondary text-text-tertiary">
              You don&apos;t have permission to change roles.
            </p>
          ) : (
            <>
              {error && (
                <div className="mt-4">
                  <Alert variant="error" title="That didn't work">
                    {error}
                  </Alert>
                </div>
              )}

              <div className="mt-4">
                <Select
                  label="Role"
                  required
                  options={roles.map((r) => ({
                    value: r.value,
                    label: r.aboveYou ? `${r.label} — above your own role` : r.label,
                    disabled: r.aboveYou,
                  }))}
                  value={roleId}
                  onChange={(event) => {
                    setError(null);
                    setRoleId(event.target.value);
                  }}
                  helper={selected?.consequence}
                />
              </div>

              {changed && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    loading={pending}
                    onClick={() => setConfirming(true)}
                    aria-label={`Change ${firstName} to ${selected?.label}. ${selected?.consequence ?? ""}`}
                  >
                    Change role
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRoleId(currentRoleId);
                      setError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Change ${firstName} to ${selected?.label}?`}
      >
        <p className="text-body text-text-secondary">{selected?.consequence}</p>
        <p className="mt-3 text-secondary text-text-tertiary">
          It takes effect the next time they load a page. Their attendance,
          leave and payslips are unchanged.
        </p>
        <div className="mt-4">
          <TextArea
            label="Why"
            optional
            rows={2}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            helper="Kept on the activity log next to who made the change."
          />
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirming(false)}>
            Keep {currentRoleName}
          </Button>
          <Button
            loading={pending}
            onClick={() => {
              setConfirming(false);
              setError(null);
              startTransition(async () => {
                const result = await changeEmployeeRoleAction({
                  membershipId,
                  roleId,
                  reason: reason || undefined,
                });
                if (!result.ok) {
                  setError(result.error);
                  setRoleId(currentRoleId);
                  return;
                }
                toast.show({
                  variant: "success",
                  message: [result.message, result.detail].filter(Boolean).join(" "),
                });
                setReason("");
                router.refresh();
              });
            }}
          >
            Change role
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
