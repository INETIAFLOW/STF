"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { settleOutsideAction } from "@/lib/expenses/actions";
import { formatAmount } from "@/lib/expenses/format";

/**
 * Settlement outside payroll (EXPENSES-MODULE.md §12): a record of how the
 * money was paid. STF moves nothing. The payroll route lands with E2.
 */
export function SettleForm({
  claimId,
  amount,
  personName,
  payrollOn,
}: {
  claimId: string;
  amount: number;
  personName: string;
  payrollOn: boolean;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [reference, setReference] = useState("");

  return (
    <Card>
      <CardHeader title="Record settlement" meta={`${formatAmount(amount)} owed to ${personName}`} />
      <Alert
        variant="info"
        title="Route: outside payroll"
      >
        {payrollOn
          ? "Settling through payroll arrives in a later update. For now, record how it was paid outside payroll."
          : "Payroll is not enabled for your company, so claims are settled outside payroll and recorded here."}
      </Alert>
      <div className="mt-3">
        <Input
          label="How it was paid"
          required
          placeholder="Cash on 12 Sept, voucher 118"
          helper="Cash, UPI or bank — and when. This is what the employee reads."
          value={reference}
          onChange={(event) => setReference(event.target.value)}
        />
      </div>
      <div className="mt-4">
        <Button
          size="lg"
          loading={pending}
          disabled={reference.trim().length < 3}
          disabledReason={reference.trim().length < 3 ? "Say how it was paid." : undefined}
          onClick={() =>
            startTransition(async () => {
              const result = await settleOutsideAction({ claimId, reference: reference.trim() });
              if (result.ok) {
                show({ variant: "success", message: result.message });
                router.refresh();
              } else {
                show({ variant: "error", message: result.error });
              }
            })
          }
        >
          Record as settled
        </Button>
      </div>
    </Card>
  );
}
