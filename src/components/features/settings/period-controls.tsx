"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { closePeriod, reopenPeriod } from "@/app/actions/periods";
import { initialActionState } from "@/lib/action-state";
import { closeConfirmText, periodLabel } from "@/lib/periods";
import type { AccountingPeriod } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function PeriodStatusBadge({ status }: { status: AccountingPeriod["status"] }) {
  return <Badge tone={status === "closed" ? "neutral" : "success"}>{status}</Badge>;
}

export function ClosePeriodButton({ period }: { period: AccountingPeriod }) {
  const [state, action] = useFormState(closePeriod.bind(null, period.period), initialActionState);
  return (
    <form action={action} className="flex flex-col items-end gap-1" onSubmit={(e) => { if (!confirm(closeConfirmText(period))) e.preventDefault(); }}>
      <SubmitButton size="sm" pendingText="Closing…">Close period</SubmitButton>
      {state.message && <p className={state.ok ? "text-xs text-success" : "text-xs text-destructive"}>{state.message}</p>}
    </form>
  );
}

export function ReopenPeriodForm({ period }: { period: AccountingPeriod }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(reopenPeriod.bind(null, period.period), initialActionState);

  if (!open) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Reopen…</Button>
        {state.ok && state.message && <p className="text-xs text-success">{state.message}</p>}
      </div>
    );
  }

  return (
    <form action={action} className="ml-auto max-w-xs space-y-2 text-left">
      {state.message && !state.ok && <Alert>{state.message}</Alert>}
      <div className="space-y-1">
        <Label htmlFor={`reopen-${period.period}`}>Reason for reopening {periodLabel(period.period)}</Label>
        <Input id={`reopen-${period.period}`} name="reason" required minLength={5} maxLength={255} placeholder="e.g. Late supplier bill for October" aria-invalid={!!state.errors?.reason} />
        <FieldError messages={state.errors?.reason} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <SubmitButton size="sm" variant="destructive" pendingText="Reopening…">Reopen period</SubmitButton>
      </div>
    </form>
  );
}
