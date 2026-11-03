"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { Plus, Trash2 } from "lucide-react";
import { saveOpeningBalances } from "@/app/actions/opening-balances";
import { initialActionState } from "@/lib/action-state";
import { centsToDecimal, formatCents, parseAmount } from "@/lib/money";
import type { Account, Contact, OpeningBalanceSet } from "@/types";
import { openingDifference, type OpeningDoc as Doc } from "@/lib/opening";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";


let n = 0;
const blankDoc = (date: string): Doc => ({ key: `d${++n}`, contact_id: "", number: "", date, due_date: "", amount: "" });

export function OpeningBalanceForm({ accounts, customers, suppliers, existing }: {
  accounts: Account[]; customers: Contact[]; suppliers: Contact[]; existing: OpeningBalanceSet | null;
}) {
  const [state, action] = useFormState(saveOpeningBalances, initialActionState);
  const [cutover, setCutover] = useState(existing?.cutover_date ?? "");
  const asOf = cutover ? new Date(new Date(`${cutover}T00:00:00`).getTime() - 86400000).toISOString().slice(0, 10) : "";
  // Balances in the account's normal direction (debit for assets/expenses, credit otherwise).
  const [balances, setBalances] = useState<Record<number, string>>(() => Object.fromEntries(
    (existing?.lines ?? []).map((l) => [l.account_id, centsToDecimal(l.debit || l.credit)]),
  ));
  const [receivables, setReceivables] = useState<Doc[]>(() => (existing?.receivables ?? []).map((r) => ({ key: `d${++n}`, contact_id: String(r.contact_id), number: r.reference ?? r.number, date: r.invoice_date, due_date: r.due_date, amount: centsToDecimal(r.total_amount) })));
  const [payables, setPayables] = useState<Doc[]>(() => (existing?.payables ?? []).map((p) => ({ key: `d${++n}`, contact_id: String(p.contact_id), number: p.supplier_invoice_number, date: p.bill_date, due_date: p.due_date, amount: centsToDecimal(p.amount_due) })));
  const postable = accounts.filter((a) => a.is_active && !a.control_type && a.code !== "3900");
  const diff = useMemo(() => openingDifference(balances, postable, receivables, payables), [balances, postable, receivables, payables]);

  const payload = JSON.stringify({
    cutover_date: cutover,
    lines: postable.filter((a) => (parseAmount(balances[a.id] ?? "") ?? 0) > 0).map((a) => {
      const v = (balances[a.id] ?? "").replace(/,/g, "").trim();
      return a.normal_balance === "debit" ? { account_id: a.id, debit: v } : { account_id: a.id, credit: v };
    }),
    receivables: receivables.filter((d) => d.contact_id && d.amount).map(({ key: _k, due_date, ...d }) => ({ ...d, contact_id: Number(d.contact_id), amount: d.amount.replace(/,/g, ""), due_date: due_date || null })),
    payables: payables.filter((d) => d.contact_id && d.amount).map(({ key: _k, due_date, ...d }) => ({ ...d, contact_id: Number(d.contact_id), amount: d.amount.replace(/,/g, ""), due_date: due_date || null })),
  });

  const docTable = (title: string, docs: Doc[], set: (d: Doc[]) => void, contacts: Contact[], who: string) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between"><CardTitle>{title}</CardTitle>
        <Button type="button" size="sm" variant="outline" onClick={() => set([...docs, blankDoc(asOf)])} disabled={!cutover}><Plus size={14} /> Add</Button></CardHeader>
      {docs.length === 0 ? <p className="px-5 pb-4 text-sm text-muted-foreground">None.</p> : (
        <Table>
          <THead><TR><TH>{who}</TH><TH>Their invoice no.</TH><TH>Date</TH><TH>Due</TH><TH className="text-right">Amount still owed</TH><TH /></TR></THead>
          <TBody>
            {docs.map((d, i) => {
              const upd = (p: Partial<Doc>) => set(docs.map((x) => (x.key === d.key ? { ...x, ...p } : x)));
              return (
                <TR key={d.key}>
                  <TD><Select aria-label={`${title} ${i + 1} ${who}`} value={d.contact_id} onChange={(e) => upd({ contact_id: e.target.value })} className="h-8 text-xs">
                    <option value="">Choose…</option>{contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></TD>
                  <TD><Input aria-label={`${title} ${i + 1} number`} value={d.number} onChange={(e) => upd({ number: e.target.value })} className="h-8" /></TD>
                  <TD><Input aria-label={`${title} ${i + 1} date`} type="date" max={asOf} value={d.date} onChange={(e) => upd({ date: e.target.value })} className="h-8" /></TD>
                  <TD><Input aria-label={`${title} ${i + 1} due`} type="date" value={d.due_date} onChange={(e) => upd({ due_date: e.target.value })} className="h-8" /></TD>
                  <TD><Input aria-label={`${title} ${i + 1} amount`} inputMode="decimal" value={d.amount} onChange={(e) => upd({ amount: e.target.value })} className="h-8 text-right font-mono" /></TD>
                  <TD><Button type="button" size="icon" variant="ghost" aria-label={`Remove ${title} ${i + 1}`} onClick={() => set(docs.filter((x) => x.key !== d.key))}><Trash2 size={14} /></Button></TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </Card>
  );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="payload" value={payload} />
      {state.message && <Alert>{state.message}</Alert>}
      <Card className="flex flex-wrap items-end gap-6 p-5">
        <div className="space-y-1">
          <Label htmlFor="ob-cutover">Cut-over date (first day in Ledgerly)</Label>
          <Input id="ob-cutover" type="date" required value={cutover} disabled={!!existing} onChange={(e) => setCutover(e.target.value)} aria-invalid={!!state.errors?.cutover_date} />
        </div>
        {asOf && <p className="pb-2 text-sm text-muted-foreground">Balances as of the end of <strong>{asOf}</strong>. Every month up to then is closed after saving.</p>}
      </Card>

      <Card>
        <CardHeader><CardTitle>Account balances</CardTitle></CardHeader>
        <p className="px-5 pb-3 text-sm text-muted-foreground">Enter each balance in its normal direction (assets and expenses as debits; liabilities, equity and revenue as credits). Receivables and payables go in the lists below, per customer and supplier.</p>
        <div className="max-h-[28rem] overflow-auto">
          <Table>
            <THead><TR><TH>Account</TH><TH className="w-24">Side</TH><TH className="w-44 text-right">Balance</TH></TR></THead>
            <TBody>
              {postable.map((a) => (
                <TR key={a.id}>
                  <TD><span className="font-mono text-muted-foreground">{a.code}</span> {a.name}</TD>
                  <TD className="text-xs text-muted-foreground">{a.normal_balance}</TD>
                  <TD><Input aria-label={`Balance ${a.code}`} inputMode="decimal" className="h-8 text-right font-mono" value={balances[a.id] ?? ""} onChange={(e) => setBalances({ ...balances, [a.id]: e.target.value })} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>

      {docTable("Opening receivables", receivables, setReceivables, customers, "Customer")}
      {docTable("Opening payables", payables, setPayables, suppliers, "Supplier")}

      <div className="flex flex-wrap items-center justify-end gap-4">
        <p className="text-sm" data-testid="ob-difference">
          Difference to Opening Balance Equity: <span className="font-mono font-medium">{formatCents(Math.abs(diff))} {diff > 0 ? "Cr" : diff < 0 ? "Dr" : ""}</span>
        </p>
        <SubmitButton disabled={!cutover}>{existing ? "Replace opening balances" : "Save opening balances"}</SubmitButton>
      </div>
    </form>
  );
}
