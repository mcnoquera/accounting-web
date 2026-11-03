"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { allocatePayment, voidPayment } from "@/app/actions/payments";
import { initialActionState } from "@/lib/action-state";
import type { OpenDocument } from "@/lib/payments";
import type { Payment } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { AllocationTable, allocationPayload } from "./allocation-table";

export function AllocateUnapplied({ payment, docs }: { payment: Payment; docs: OpenDocument[] }) {
  const [state, action] = useFormState(allocatePayment.bind(null, payment.id), initialActionState);
  const [alloc, setAlloc] = useState<Record<number, string>>({});
  return (
    <Card>
      <CardHeader><CardTitle>Allocate the unapplied amount</CardTitle></CardHeader>
      <form action={action}>
        <input type="hidden" name="payload" value={JSON.stringify({ allocations: allocationPayload(alloc) })} />
        {state.message && <div className="px-4"><Alert>{state.message}</Alert></div>}
        <AllocationTable docs={docs} values={alloc} onChange={setAlloc} available={payment.unapplied_amount} label={payment.direction === "receipt" ? "invoice" : "bill"} />
        {docs.length > 0 && <div className="flex justify-end px-4 pb-4"><SubmitButton size="sm" disabled={allocationPayload(alloc).length === 0}>Allocate</SubmitButton></div>}
      </form>
    </Card>
  );
}

export function VoidPaymentAction({ payment }: { payment: Payment }) {
  const [state, action] = useFormState(voidPayment.bind(null, payment.id), initialActionState);
  return (
    <Card>
      <CardHeader><CardTitle>Void {payment.direction}</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="space-y-3" onSubmit={(e) => { if (!confirm(`Void ${payment.number}? Its entry is reversed and the invoices/bills it paid are reopened.`)) e.preventDefault(); }}>
          {state.message && <Alert>{state.message}</Alert>}
          <div className="space-y-1">
            <Label htmlFor="pv-reason">Reason</Label>
            <Input id="pv-reason" name="reason" required minLength={5} maxLength={255} placeholder="e.g. Cheque bounced" />
            <FieldError messages={state.errors?.reason} />
          </div>
          <SubmitButton variant="destructive" pendingText="Voiding…">Void</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
