"use client";

import { useFormState } from "react-dom";
import { recordTransfer } from "@/app/actions/transfers";
import { initialActionState } from "@/lib/action-state";
import { today } from "@/lib/dates";
import { CASH_KIND_LABEL, type Account, type CashKind } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

function CashOptions({ accounts }: { accounts: Account[] }) {
  return <>
    {(Object.keys(CASH_KIND_LABEL) as CashKind[]).map((k) => {
      const list = accounts.filter((a) => (a.cash_kind ?? "cash") === k);
      return list.length ? <optgroup key={k} label={CASH_KIND_LABEL[k]}>{list.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</optgroup> : null;
    })}
  </>;
}

export function TransferForm({ cashAccounts, expenseAccounts, firstOpenDate }: { cashAccounts: Account[]; expenseAccounts: Account[]; firstOpenDate: string | null }) {
  const [state, action] = useFormState(recordTransfer, initialActionState);
  const defaultDate = firstOpenDate && today() < firstOpenDate ? firstOpenDate : today();
  const charges = expenseAccounts.find((a) => /bank charges/i.test(a.name));
  return (
    <form action={action} className="space-y-4">
      {state.message && <Alert>{state.message}</Alert>}
      <Card className="grid gap-4 p-5 sm:grid-cols-[160px_1fr_1fr]">
        <div className="space-y-1"><Label htmlFor="t-date">Date</Label><Input id="t-date" name="date" type="date" required min={firstOpenDate ?? undefined} defaultValue={defaultDate} /></div>
        <div className="space-y-1"><Label htmlFor="t-from">From</Label>
          <Select id="t-from" name="from_account_id" required defaultValue=""><option value="" disabled>Choose…</option><CashOptions accounts={cashAccounts} /></Select>
          <FieldError messages={state.errors?.from_account_id} /></div>
        <div className="space-y-1"><Label htmlFor="t-to">To</Label>
          <Select id="t-to" name="to_account_id" required defaultValue=""><option value="" disabled>Choose…</option><CashOptions accounts={cashAccounts} /></Select>
          <FieldError messages={state.errors?.to_account_id} /></div>
        <div className="space-y-1"><Label htmlFor="t-amount">Amount</Label><Input id="t-amount" name="amount" required inputMode="decimal" className="text-right font-mono" placeholder="0.00" /><FieldError messages={state.errors?.amount} /></div>
        <div className="space-y-1"><Label htmlFor="t-fee">Fee <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="t-fee" name="fee" inputMode="decimal" className="text-right font-mono" placeholder="0.00" /></div>
        <div className="space-y-1"><Label htmlFor="t-fee-acct">Fee account</Label>
          <Select id="t-fee-acct" name="fee_account_id" defaultValue={charges ? String(charges.id) : ""}><option value="">—</option>{expenseAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</Select>
          <FieldError messages={state.errors?.fee_account_id} /></div>
        <div className="space-y-1 sm:col-span-3"><Label htmlFor="t-ref">Reference <span className="font-normal text-muted-foreground">(e.g. GCash ref. no.)</span></Label><Input id="t-ref" name="reference" /></div>
      </Card>
      <div className="flex justify-end"><SubmitButton>Record transfer</SubmitButton></div>
    </form>
  );
}
