"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { deleteInvoice, issueInvoice, voidInvoice } from "@/app/actions/invoices";
import { initialActionState } from "@/lib/action-state";
import type { SalesInvoice } from "@/types";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function DraftInvoiceActions({ invoice }: { invoice: SalesInvoice }) {
  const [issueState, issue] = useFormState(issueInvoice.bind(null, invoice.id), initialActionState);
  const [delState, del] = useFormState(deleteInvoice.bind(null, invoice.id), initialActionState);
  return (
    <Card>
      <CardHeader><CardTitle>Issue invoice</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {issueState.message && <Alert>{issueState.message}</Alert>}
        {delState.message && <Alert>{delState.message}</Alert>}
        <p className="text-sm text-muted-foreground">Issuing gives the invoice its number, posts it to the ledger (receivable, revenue and output VAT) and makes it read-only.</p>
        <div className="flex flex-wrap gap-2">
          <form action={issue} onSubmit={(e) => { if (!confirm("Issue this invoice? It gets the next invoice number and is posted to the ledger.")) e.preventDefault(); }}>
            <SubmitButton pendingText="Issuing…">Issue invoice</SubmitButton>
          </form>
          <Link href={`/invoices/${invoice.id}/edit`} className={buttonClass("outline")}>Edit</Link>
          <form action={del} onSubmit={(e) => { if (!confirm("Delete this draft invoice?")) e.preventDefault(); }}>
            <SubmitButton variant="ghost" className="text-destructive" pendingText="Deleting…">Delete draft</SubmitButton>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

export function VoidInvoiceAction({ invoice }: { invoice: SalesInvoice }) {
  const [state, action] = useFormState(voidInvoice.bind(null, invoice.id), initialActionState);
  return (
    <Card>
      <CardHeader><CardTitle>Void invoice</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="space-y-3" onSubmit={(e) => { if (!confirm(`Void ${invoice.number}? Its ledger entry is reversed.`)) e.preventDefault(); }}>
          {state.message && <Alert>{state.message}</Alert>}
          <p className="text-sm text-muted-foreground">For an invoice issued in error. The number stays used, and the entry is reversed (on the invoice date, or the first open date if that month is closed).</p>
          <div className="space-y-1">
            <Label htmlFor="void-reason">Reason</Label>
            <Input id="void-reason" name="reason" required minLength={5} maxLength={255} placeholder="e.g. Wrong customer" aria-invalid={!!state.errors?.reason} />
            <FieldError messages={state.errors?.reason} />
          </div>
          <SubmitButton variant="destructive" pendingText="Voiding…">Void invoice</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
