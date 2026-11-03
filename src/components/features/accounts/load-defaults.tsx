"use client";

import { useFormState } from "react-dom";
import { loadDefaultAccounts } from "@/app/actions/accounts";
import { initialActionState } from "@/lib/action-state";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoadDefaults() {
  const [state, action] = useFormState(loadDefaultAccounts, initialActionState);
  return (
    <form action={action} className="space-y-3">
      {state.message && <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>}
      <p className="text-sm text-muted-foreground">
        Start from a Philippine small-business chart: cash and bank, receivables, Input and Output VAT, withholding taxes,
        SSS / PhilHealth / Pag-IBIG payables, revenue and operating expenses, grouped for reporting. You can rename,
        add or deactivate accounts afterwards. Have your external accountant review it before go-live.
      </p>
      <SubmitButton pendingText="Loading…">Load Philippine starter chart</SubmitButton>
    </form>
  );
}
