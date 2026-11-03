"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { deleteBill, recordBill, voidBill } from "@/app/actions/bills";
import { initialActionState } from "@/lib/action-state";
import type { PurchaseBill } from "@/types";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function DraftBillActions({ bill }: { bill: PurchaseBill }) {
  const [recState, rec] = useFormState(recordBill.bind(null, bill.id), initialActionState);
  const [delState, del] = useFormState(deleteBill.bind(null, bill.id), initialActionState);
  return (
    <Card>
      <CardHeader><CardTitle>Record bill</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {recState.message && <Alert>{recState.message}</Alert>}
        {delState.message && <Alert>{delState.message}</Alert>}
        <p className="text-sm text-muted-foreground">Recording numbers the bill and posts it: expenses, input VAT, withholding tax payable and the amount owed to the supplier.</p>
        <div className="flex flex-wrap gap-2">
          <form action={rec}><SubmitButton pendingText="Recording…">Record bill</SubmitButton></form>
          <Link href={`/bills/${bill.id}/edit`} className={buttonClass("outline")}>Edit</Link>
          <form action={del} onSubmit={(e) => { if (!confirm("Delete this draft bill?")) e.preventDefault(); }}>
            <SubmitButton variant="ghost" className="text-destructive" pendingText="Deleting…">Delete draft</SubmitButton>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

export function VoidBillAction({ bill }: { bill: PurchaseBill }) {
  const [state, action] = useFormState(voidBill.bind(null, bill.id), initialActionState);
  return (
    <Card>
      <CardHeader><CardTitle>Void bill</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="space-y-3" onSubmit={(e) => { if (!confirm(`Void ${bill.number}? Its ledger entry is reversed.`)) e.preventDefault(); }}>
          {state.message && <Alert>{state.message}</Alert>}
          <div className="space-y-1">
            <Label htmlFor="void-reason">Reason</Label>
            <Input id="void-reason" name="reason" required minLength={5} maxLength={255} placeholder="e.g. Entered twice" aria-invalid={!!state.errors?.reason} />
            <FieldError messages={state.errors?.reason} />
          </div>
          <SubmitButton variant="destructive" pendingText="Voiding…">Void bill</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
