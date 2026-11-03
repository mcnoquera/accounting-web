"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { Plus, Trash2 } from "lucide-react";
import { saveInvoice } from "@/app/actions/invoices";
import { initialActionState } from "@/lib/action-state";
import { invoiceTotals, type DraftInvoiceLine } from "@/lib/invoices";
import { centsToDecimal, formatCents } from "@/lib/money";
import { today } from "@/lib/dates";
import type { Account, Contact, SalesInvoice, TaxCode } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

let n = 0;
const blank = (vatCodeId = ""): DraftInvoiceLine => ({ key: `il${++n}`, description: "", quantity: "1", unit_price: "", account_id: "", vat_code_id: vatCodeId });

export function InvoiceForm({ invoice, customers, accounts, taxCodes, firstOpenDate = null, defaultVatCodeId = "" }: {
  invoice?: SalesInvoice;
  customers: Contact[];
  accounts: Account[];
  taxCodes: TaxCode[];
  firstOpenDate?: string | null;
  defaultVatCodeId?: string;
}) {
  const [state, action] = useFormState(saveInvoice.bind(null, invoice?.id ?? null), initialActionState);
  const [contactId, setContactId] = useState(invoice ? String(invoice.contact_id) : "");
  const [date, setDate] = useState(invoice?.invoice_date ?? (firstOpenDate && today() < firstOpenDate ? firstOpenDate : today()));
  const [dueDate, setDueDate] = useState(invoice?.due_date ?? "");
  const [reference, setReference] = useState(invoice?.reference ?? "");
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [lines, setLines] = useState<DraftInvoiceLine[]>(() => invoice?.lines?.length
    ? invoice.lines.map((l) => ({ key: `il${++n}`, description: l.description, quantity: l.quantity, unit_price: centsToDecimal(l.unit_price), account_id: String(l.account_id), vat_code_id: l.vat_code_id ? String(l.vat_code_id) : "" }))
    : [blank(defaultVatCodeId)]);

  const vatCodes = taxCodes.filter((c) => c.kind === "vat" && c.is_active);
  const revenue = accounts.filter((a) => a.type === "revenue" && a.is_active);
  const totals = useMemo(() => invoiceTotals(lines, taxCodes), [lines, taxCodes]);
  const update = (key: string, patch: Partial<DraftInvoiceLine>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const customer = customers.find((c) => String(c.id) === contactId);
  const canSubmit = !!contactId && !totals.invalid && totals.total > 0 && lines.every((l) => l.description.trim() && l.account_id);

  const payload = JSON.stringify({
    contact_id: contactId ? Number(contactId) : null,
    invoice_date: date,
    due_date: dueDate || null,
    reference: reference || null,
    notes: notes || null,
    lines: lines.map((l) => ({
      description: l.description, quantity: l.quantity.trim(), unit_price: l.unit_price.replace(/,/g, "").trim(),
      account_id: l.account_id ? Number(l.account_id) : null, vat_code_id: l.vat_code_id ? Number(l.vat_code_id) : null,
    })),
  });

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="payload" value={payload} />
      {state.message && <Alert>{state.message}</Alert>}

      <Card className="grid gap-4 p-5 sm:grid-cols-[1fr_160px_160px_180px]">
        <div className="space-y-1">
          <Label htmlFor="inv-customer">Customer</Label>
          <Select id="inv-customer" required value={contactId} onChange={(e) => setContactId(e.target.value)} aria-invalid={!!state.errors?.contact_id}>
            <option value="">Choose customer…</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          {customer && <p className="text-xs text-muted-foreground">{[customer.tin && `TIN ${customer.tin}`, `${customer.payment_terms_days}-day terms`].filter(Boolean).join(" · ")}</p>}
          <FieldError messages={state.errors?.contact_id} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="inv-date">Invoice date</Label>
          <Input id="inv-date" type="date" required min={firstOpenDate ?? undefined} value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={!!state.errors?.invoice_date} />
          <FieldError messages={state.errors?.invoice_date} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="inv-due">Due date <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="inv-due" type="date" min={date} value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-invalid={!!state.errors?.due_date} />
          <FieldError messages={state.errors?.due_date} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="inv-ref">Customer PO / reference</Label>
          <Input id="inv-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[1fr_90px_130px_200px_150px_120px_40px] gap-2 border-b bg-muted/40 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
          <span>Description</span><span className="text-right">Qty</span><span className="text-right">Unit price</span><span>Revenue account</span><span>VAT</span><span className="text-right">Amount</span><span />
        </div>
        <div className="divide-y">
          {lines.map((l, i) => {
            const t = invoiceTotals([l], taxCodes);
            const err = ["description", "quantity", "unit_price", "account_id", "vat_code_id"].map((f) => state.errors?.[`lines.${i}.${f}`]).find(Boolean);
            return (
              <div key={l.key} className="grid grid-cols-2 gap-2 px-4 py-3 md:grid-cols-[1fr_90px_130px_200px_150px_120px_40px]">
                <Input aria-label={`Line ${i + 1} description`} className="col-span-2 md:col-span-1" value={l.description} onChange={(e) => update(l.key, { description: e.target.value })} placeholder="Item or service" />
                <Input aria-label={`Line ${i + 1} quantity`} inputMode="decimal" className="text-right font-mono" value={l.quantity} onChange={(e) => update(l.key, { quantity: e.target.value })} />
                <Input aria-label={`Line ${i + 1} unit price`} inputMode="decimal" className="text-right font-mono" placeholder="0.00" value={l.unit_price} onChange={(e) => update(l.key, { unit_price: e.target.value })} />
                <Select aria-label={`Line ${i + 1} account`} value={l.account_id} onChange={(e) => update(l.key, { account_id: e.target.value })}>
                  <option value="">Account…</option>
                  {revenue.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
                </Select>
                <Select aria-label={`Line ${i + 1} VAT`} value={l.vat_code_id} onChange={(e) => update(l.key, { vat_code_id: e.target.value })}>
                  <option value="">No VAT code</option>
                  {vatCodes.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
                </Select>
                <span className="self-center text-right font-mono text-sm tabular-nums" data-testid={`line-${i + 1}-amount`}>{t.invalid ? "—" : formatCents(t.net)}</span>
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove line ${i + 1}`} onClick={() => setLines((ls) => ls.length > 1 ? ls.filter((x) => x.key !== l.key) : ls)} disabled={lines.length <= 1}><Trash2 size={14} /></Button>
                {err && <p className="col-span-full text-xs text-destructive">{err[0]}</p>}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4 border-t bg-muted/40 px-4 py-3">
          <Button type="button" variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, blank(ls[ls.length - 1]?.vat_code_id ?? defaultVatCodeId)])}><Plus size={14} /> Add line</Button>
          <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 font-mono text-sm tabular-nums" data-testid="invoice-totals">
            <dt className="font-sans text-muted-foreground">Net</dt><dd className="text-right">{formatCents(totals.net)}</dd>
            <dt className="font-sans text-muted-foreground">VAT</dt><dd className="text-right">{formatCents(totals.vat)}</dd>
            <dt className="font-sans font-medium">Total</dt><dd className="text-right font-semibold">{formatCents(totals.total)}</dd>
          </dl>
        </div>
      </Card>

      <div className="space-y-1">
        <Label htmlFor="inv-notes">Notes on the invoice <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Textarea id="inv-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment instructions, delivery details…" />
      </div>

      <div className="flex justify-end gap-2">
        <SubmitButton name="intent" value="draft" variant="outline" disabled={!canSubmit}>Save draft</SubmitButton>
        <SubmitButton name="intent" value="issue" disabled={!canSubmit}>Save &amp; issue</SubmitButton>
      </div>
    </form>
  );
}
