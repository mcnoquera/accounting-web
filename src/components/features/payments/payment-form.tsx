"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { recordPayment } from "@/app/actions/payments";
import { initialActionState } from "@/lib/action-state";
import { cents, suggestedWithholdingBase, withholdingOn, type OpenDocument } from "@/lib/payments";
import { centsToDecimal, formatCents } from "@/lib/money";
import { today } from "@/lib/dates";
import type { Account, Contact, PaymentDirection, TaxCode } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { AllocationTable, allocationPayload } from "./allocation-table";

export function PaymentForm({ direction, contacts, cashAccounts, openDocs, ewtCodes, firstOpenDate = null, initialContactId = "", initialDocumentId }: {
  direction: PaymentDirection;
  contacts: Contact[];
  cashAccounts: Account[];
  /** Open invoices (receipt) or bills (payment) of every contact, keyed by contact id. */
  openDocs: Record<number, OpenDocument[]>;
  ewtCodes: TaxCode[];
  firstOpenDate?: string | null;
  initialContactId?: string;
  initialDocumentId?: number;
}) {
  const receipt = direction === "receipt";
  const [state, action] = useFormState(recordPayment, initialActionState);
  const [contactId, setContactId] = useState(initialContactId);
  const [date, setDate] = useState(firstOpenDate && today() < firstOpenDate ? firstOpenDate : today());
  const [cashId, setCashId] = useState(cashAccounts[0] ? String(cashAccounts[0].id) : "");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [atc, setAtc] = useState("");
  const [base, setBase] = useState("");
  const [withheld, setWithheld] = useState("");
  const [alloc, setAlloc] = useState<Record<number, string>>({});
  const docs = useMemo(() => (contactId ? openDocs[Number(contactId)] ?? [] : []), [contactId, openDocs]);

  // Coming from an invoice/bill: pre-fill its balance.
  useEffect(() => {
    const d = docs.find((x) => x.id === initialDocumentId);
    if (d && !amount) { setAmount(centsToDecimal(d.balance_due)); setAlloc({ [d.id]: centsToDecimal(d.balance_due) }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs, initialDocumentId]);

  const code = ewtCodes.find((c) => String(c.id) === atc);
  const available = cents(amount) + (receipt ? cents(withheld) : 0);
  const suggestBase = () => {
    const b = suggestedWithholdingBase(Object.fromEntries(Object.entries(alloc).map(([k, v]) => [k, cents(v)])), docs);
    setBase(centsToDecimal(b));
    if (code) setWithheld(centsToDecimal(withholdingOn(b, code.rate_bp)));
  };

  const payload = JSON.stringify({
    direction, contact_id: contactId ? Number(contactId) : null, payment_date: date, cash_account_id: cashId ? Number(cashId) : null,
    amount: amount.replace(/,/g, "").trim() || "0", reference: reference || null,
    ...(receipt && cents(withheld) > 0 ? { ewt_code_id: atc ? Number(atc) : null, withholding_base: base.replace(/,/g, "") || "0", withholding_amount: withheld.replace(/,/g, "") } : {}),
    allocations: allocationPayload(alloc),
  });
  const applied = Object.values(alloc).reduce((s, v) => s + cents(v), 0);
  const canSubmit = !!contactId && !!cashId && available > 0 && applied <= available;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="payload" value={payload} />
      {state.message && <Alert>{state.message}</Alert>}
      <Card className="grid gap-4 p-5 sm:grid-cols-[1fr_160px_220px]">
        <div className="space-y-1">
          <Label htmlFor="p-contact">{receipt ? "Customer" : "Supplier"}</Label>
          <Select id="p-contact" required value={contactId} onChange={(e) => { setContactId(e.target.value); setAlloc({}); }} aria-invalid={!!state.errors?.contact_id}>
            <option value="">Choose…</option>
            {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <FieldError messages={state.errors?.contact_id} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-date">Date</Label>
          <Input id="p-date" type="date" required min={firstOpenDate ?? undefined} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-cash">{receipt ? "Received into" : "Paid from"}</Label>
          <Select id="p-cash" required value={cashId} onChange={(e) => setCashId(e.target.value)} aria-invalid={!!state.errors?.cash_account_id}>
            {cashAccounts.length === 0 && <option value="">No cash or bank accounts</option>}
            {cashAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
          </Select>
          <FieldError messages={state.errors?.cash_account_id} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-amount">{receipt ? "Amount received" : "Amount paid"}</Label>
          <Input id="p-amount" required inputMode="decimal" className="text-right font-mono" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!!state.errors?.amount} />
          <FieldError messages={state.errors?.amount} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="p-ref">Reference <span className="font-normal text-muted-foreground">(OR / cheque / transfer no.)</span></Label>
          <Input id="p-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>
      </Card>

      {receipt && (
        <Card className="grid gap-4 p-5 sm:grid-cols-[1fr_170px_150px]">
          <div className="space-y-1">
            <Label htmlFor="p-atc">Tax withheld by the customer <span className="font-normal text-muted-foreground">(ATC on their Form 2307)</span></Label>
            <Select id="p-atc" value={atc} onChange={(e) => setAtc(e.target.value)} aria-invalid={!!state.errors?.ewt_code_id}>
              <option value="">None withheld</option>
              {ewtCodes.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.rate}% · {c.name}</option>)}
            </Select>
            <FieldError messages={state.errors?.ewt_code_id} />
          </div>
          {atc && <>
            <div className="space-y-1">
              <Label htmlFor="p-base">Income payment (base)</Label>
              <Input id="p-base" inputMode="decimal" className="text-right font-mono" value={base} onChange={(e) => { setBase(e.target.value); if (code) setWithheld(centsToDecimal(withholdingOn(cents(e.target.value), code.rate_bp))); }} />
              <button type="button" className="text-xs text-primary hover:underline" onClick={suggestBase}>Use net of applied invoices</button>
            </div>
            <div className="space-y-1">
              <Label htmlFor="p-wht">Amount withheld</Label>
              <Input id="p-wht" inputMode="decimal" className="text-right font-mono" value={withheld} onChange={(e) => setWithheld(e.target.value)} aria-invalid={!!state.errors?.withholding_amount} />
              <FieldError messages={state.errors?.withholding_amount} />
            </div>
          </>}
        </Card>
      )}

      <Card>
        {contactId
          ? <AllocationTable docs={docs} values={alloc} onChange={setAlloc} available={available} label={receipt ? "invoice" : "bill"} />
          : <p className="px-4 py-3 text-sm text-muted-foreground">Choose a {receipt ? "customer" : "supplier"} to see their open {receipt ? "invoices" : "bills"}.</p>}
      </Card>

      <div className="flex items-center justify-end gap-4">
        <p className="text-sm text-muted-foreground">Settles {formatCents(available)}{receipt && cents(withheld) > 0 && <> ({formatCents(cents(amount))} cash + {formatCents(cents(withheld))} withheld)</>}</p>
        <SubmitButton disabled={!canSubmit}>{receipt ? "Record receipt" : "Record payment"}</SubmitButton>
      </div>
    </form>
  );
}
