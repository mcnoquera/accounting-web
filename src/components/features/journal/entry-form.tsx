"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { Plus, Trash2 } from "lucide-react";
import { saveEntry } from "@/app/actions/journal";
import { initialActionState } from "@/lib/action-state";
import { blankLine, summarizeLines, type DraftLine } from "@/lib/journal";
import { centsToDecimal, formatCents, parseAmount } from "@/lib/money";
import { today } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Account, JournalEntry } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

function fromEntry(entry?: JournalEntry): DraftLine[] {
  if (!entry) return [blankLine(), blankLine()];
  return entry.lines.map((l) => ({
    ...blankLine(),
    account_id: String(l.account_id),
    debit: l.debit ? centsToDecimal(l.debit) : "",
    credit: l.credit ? centsToDecimal(l.credit) : "",
    memo: l.memo ?? "",
  }));
}

export function EntryForm({ accounts, entry }: { accounts: Account[]; entry?: JournalEntry }) {
  const [state, action] = useFormState(saveEntry.bind(null, entry?.id ?? null), initialActionState);
  const [date, setDate] = useState(entry?.entry_date ?? today());
  const [reference, setReference] = useState(entry?.reference ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [lines, setLines] = useState<DraftLine[]>(() => fromEntry(entry));
  const summary = useMemo(() => summarizeLines(lines), [lines]);

  const active = accounts.filter((a) => a.is_active || lines.some((l) => l.account_id === String(a.id)));

  const update = (key: string, patch: Partial<DraftLine>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const remove = (key: string) => setLines((ls) => (ls.length > 2 ? ls.filter((l) => l.key !== key) : ls));

  /** Fills the selected line with whatever amount brings the entry into balance. */
  const balanceLine = (l: DraftLine) => {
    const d = parseAmount(l.debit) ?? 0;
    const c = parseAmount(l.credit) ?? 0;
    const diffWithout = summary.difference - (d - c);
    if (diffWithout > 0) update(l.key, { debit: "", credit: centsToDecimal(diffWithout) });
    else if (diffWithout < 0) update(l.key, { debit: centsToDecimal(-diffWithout), credit: "" });
  };

  const payload = JSON.stringify({
    entry_date: date,
    reference: reference || null,
    description,
    lines: lines.map((l) => ({ account_id: l.account_id ? Number(l.account_id) : null, debit: l.debit.replace(/,/g, "") || null, credit: l.credit.replace(/,/g, "") || null, memo: l.memo || null })),
  });

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="payload" value={payload} />
      {state.message && <Alert>{state.message}</Alert>}

      <Card className="grid gap-4 p-5 sm:grid-cols-[180px_200px_1fr]">
        <div className="space-y-1">
          <Label htmlFor="entry_date">Date</Label>
          <Input id="entry_date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={!!state.errors?.entry_date} />
          <FieldError messages={state.errors?.entry_date} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="reference">Reference</Label>
          <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Invoice / cheque #" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Input id="description" required value={description} onChange={(e) => setDescription(e.target.value)} aria-invalid={!!state.errors?.description} placeholder="What is this transaction?" />
          <FieldError messages={state.errors?.description} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[1fr_140px_140px_1fr_72px] gap-2 border-b bg-muted/40 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
          <span>Account</span><span className="text-right">Debit</span><span className="text-right">Credit</span><span>Memo</span><span />
        </div>
        <div className="divide-y">
          {lines.map((l, i) => {
            const err = state.errors?.[`lines.${i}.debit`] ?? state.errors?.[`lines.${i}.credit`] ?? state.errors?.[`lines.${i}.account_id`] ?? state.errors?.[`lines.${i}`];
            return (
              <div key={l.key} className="grid grid-cols-2 gap-2 px-4 py-3 md:grid-cols-[1fr_140px_140px_1fr_72px]">
                <Select aria-label={`Line ${i + 1} account`} className="col-span-2 md:col-span-1" value={l.account_id} onChange={(e) => update(l.key, { account_id: e.target.value })}>
                  <option value="">Select account…</option>
                  {active.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
                  ))}
                </Select>
                <Input aria-label={`Line ${i + 1} debit`} inputMode="decimal" className="text-right font-mono" placeholder="0.00" value={l.debit} onChange={(e) => update(l.key, { debit: e.target.value, credit: e.target.value ? "" : l.credit })} />
                <Input aria-label={`Line ${i + 1} credit`} inputMode="decimal" className="text-right font-mono" placeholder="0.00" value={l.credit} onChange={(e) => update(l.key, { credit: e.target.value, debit: e.target.value ? "" : l.debit })} />
                <Input aria-label={`Line ${i + 1} memo`} className="col-span-2 md:col-span-1" placeholder="Memo" value={l.memo} onChange={(e) => update(l.key, { memo: e.target.value })} />
                <div className="col-span-2 flex justify-end gap-1 md:col-span-1">
                  <Button type="button" variant="ghost" size="icon" title="Balance with this line" aria-label={`Balance using line ${i + 1}`} onClick={() => balanceLine(l)} disabled={summary.difference === 0}>=</Button>
                  <Button type="button" variant="ghost" size="icon" title="Remove line" aria-label={`Remove line ${i + 1}`} onClick={() => remove(l.key)} disabled={lines.length <= 2}><Trash2 size={14} /></Button>
                </div>
                {err && <p className="col-span-full text-xs text-destructive">{err[0]}</p>}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/40 px-4 py-3">
          <Button type="button" variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, blankLine()])}><Plus size={14} /> Add line</Button>
          <div className="flex items-center gap-6 font-mono text-sm tabular-nums">
            <span>Dr {formatCents(summary.debit)}</span>
            <span>Cr {formatCents(summary.credit)}</span>
            <span data-testid="balance-status" className={cn("rounded px-2 py-0.5 font-sans text-xs font-medium", summary.balanced ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
              {summary.balanced ? "Balanced" : `Out by ${formatCents(Math.abs(summary.difference))}`}
            </span>
          </div>
        </div>
      </Card>

      {(summary.invalid.length > 0 || state.errors?.lines) && (
        <Alert>
          <ul className="list-inside list-disc">
            {[...summary.invalid, ...(state.errors?.lines ?? [])].map((m) => <li key={m}>{m}</li>)}
          </ul>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <SubmitButton name="intent" value="draft" variant="outline" disabled={!summary.canSubmit}>Save draft</SubmitButton>
        <SubmitButton name="intent" value="post" disabled={!summary.canSubmit}>Save &amp; review for posting</SubmitButton>
      </div>
    </form>
  );
}
