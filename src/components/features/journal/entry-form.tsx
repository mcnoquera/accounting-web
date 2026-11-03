"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { Plus, Receipt, Trash2 } from "lucide-react";
import { saveEntry } from "@/app/actions/journal";
import { initialActionState } from "@/lib/action-state";
import { postingAccounts } from "@/lib/accounts";
import { blankLine, summarizeLines, type DraftLine } from "@/lib/journal";
import { centsToDecimal, formatCents, parseAmount } from "@/lib/money";
import { today } from "@/lib/dates";
import { checkTax, taxFixes, taxRoleLabel } from "@/lib/tax";
import { cn } from "@/lib/utils";
import type { Account, JournalEntry, TaxCode } from "@/types";
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
    vat_code_id: l.vat_code_id ? String(l.vat_code_id) : "",
    ewt_code_id: l.ewt_code_id ? String(l.ewt_code_id) : "",
  }));
}

export function EntryForm({ accounts, entry, firstOpenDate = null, taxCodes = [] }: { accounts: Account[]; entry?: JournalEntry; firstOpenDate?: string | null; taxCodes?: TaxCode[] }) {
  const [state, action] = useFormState(saveEntry.bind(null, entry?.id ?? null), initialActionState);
  const [date, setDate] = useState(entry?.entry_date ?? (firstOpenDate && today() < firstOpenDate ? firstOpenDate : today()));
  const [reference, setReference] = useState(entry?.reference ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [lines, setLines] = useState<DraftLine[]>(() => fromEntry(entry));
  const summary = useMemo(() => summarizeLines(lines), [lines]);

  // Active detail accounts only (group accounts can't take postings), plus any already on the entry.
  const active = postingAccounts(accounts, lines.map((l) => Number(l.account_id)).filter(Boolean));

  // Active codes, plus any inactive ones already on this entry so they still display.
  const usedCodeIds = new Set(lines.flatMap((l) => [l.vat_code_id, l.ewt_code_id]).filter(Boolean).map(Number));
  const codes = taxCodes.filter((c) => c.is_active || usedCodeIds.has(c.id));
  const vatCodes = codes.filter((c) => c.kind === "vat");
  const ewtCodes = codes.filter((c) => c.kind === "ewt");
  const accountById = new Map(accounts.map((a) => [a.id, a]));

  const taxChecks = useMemo(() => checkTax(
    lines.map((l) => ({
      account_id: l.account_id ? Number(l.account_id) : null,
      debit: parseAmount(l.debit) ?? 0,
      credit: parseAmount(l.credit) ?? 0,
      vat_code_id: l.vat_code_id ? Number(l.vat_code_id) : null,
      ewt_code_id: l.ewt_code_id ? Number(l.ewt_code_id) : null,
    })),
    accounts,
    taxCodes,
  ), [lines, accounts, taxCodes]);
  const fixes = taxFixes(taxChecks, accounts);

  /** Adds (or tops up) a line on each tax account so the tax matches the codes. */
  const applyTaxFixes = () => setLines((ls) => {
    let next = [...ls];
    for (const f of fixes) {
      if (!f.account) continue;
      const signed = f.debit - f.credit;
      const existing = next.find((l) => Number(l.account_id) === f.account!.id);
      if (existing) {
        const total = (parseAmount(existing.debit) ?? 0) - (parseAmount(existing.credit) ?? 0) + signed;
        next = next.map((l) => l.key === existing.key
          ? { ...l, debit: total > 0 ? centsToDecimal(total) : "", credit: total < 0 ? centsToDecimal(-total) : "" }
          : l);
      } else {
        next = [...next, { ...blankLine(), account_id: String(f.account.id), debit: f.debit ? centsToDecimal(f.debit) : "", credit: f.credit ? centsToDecimal(f.credit) : "" }];
      }
    }
    return next;
  });

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
    lines: lines.map((l) => ({ account_id: l.account_id ? Number(l.account_id) : null, debit: l.debit.replace(/,/g, "") || null, credit: l.credit.replace(/,/g, "") || null, memo: l.memo || null, vat_code_id: l.vat_code_id ? Number(l.vat_code_id) : null, ewt_code_id: l.ewt_code_id ? Number(l.ewt_code_id) : null })),
  });

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="payload" value={payload} />
      {state.message && <Alert>{state.message}</Alert>}

      <Card className="grid gap-4 p-5 sm:grid-cols-[180px_200px_1fr]">
        <div className="space-y-1">
          <Label htmlFor="entry_date">Date</Label>
          <Input id="entry_date" type="date" required min={firstOpenDate ?? undefined} value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={!!state.errors?.entry_date} />
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
            const err = state.errors?.[`lines.${i}.debit`] ?? state.errors?.[`lines.${i}.credit`] ?? state.errors?.[`lines.${i}.account_id`]
              ?? state.errors?.[`lines.${i}.vat_code_id`] ?? state.errors?.[`lines.${i}.ewt_code_id`] ?? state.errors?.[`lines.${i}`];
            const account = l.account_id ? accountById.get(Number(l.account_id)) : undefined;
            // Tax codes go on the base line of a sale or purchase, never on the tax account itself.
            const taxable = taxCodes.length > 0 && account !== undefined && !account.tax_role;
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
                {taxable && (
                  <div className="col-span-full flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Tax:</span>
                    <Select aria-label={`Line ${i + 1} VAT code`} className="h-7 w-auto py-0 text-xs" value={l.vat_code_id} onChange={(e) => update(l.key, { vat_code_id: e.target.value })}>
                      <option value="">No VAT code</option>
                      {vatCodes.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
                    </Select>
                    <Select aria-label={`Line ${i + 1} withholding code`} className="h-7 w-auto py-0 text-xs" value={l.ewt_code_id} onChange={(e) => update(l.key, { ewt_code_id: e.target.value })}>
                      <option value="">No withholding</option>
                      {ewtCodes.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
                    </Select>
                  </div>
                )}
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

      {taxChecks.length > 0 && (
        <Card className="space-y-2 p-4 text-sm" data-testid="tax-check">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">Tax from codes</p>
            {fixes.length > 0 && (
              <Button type="button" size="sm" variant="outline" onClick={applyTaxFixes} disabled={fixes.every((f) => !f.account)}>
                <Receipt size={14} /> Add tax lines
              </Button>
            )}
          </div>
          <ul className="space-y-1">
            {taxChecks.map((c) => (
              <li key={c.role} className="flex flex-wrap justify-between gap-2 font-mono text-xs tabular-nums">
                <span className="font-sans">{taxRoleLabel(c.role)}</span>
                <span className={c.ok ? "text-success" : "text-destructive"}>
                  needs {c.expected >= 0 ? "Dr" : "Cr"} {formatCents(Math.abs(c.expected))} · has {formatCents(Math.abs(c.actual))}{c.actual !== 0 ? (c.actual > 0 ? " Dr" : " Cr") : ""}
                </span>
              </li>
            ))}
          </ul>
          {fixes.some((f) => !f.account) && (
            <p className="text-xs text-destructive">
              No active account is tagged {fixes.filter((f) => !f.account).map((f) => `“${taxRoleLabel(f.role)}”`).join(", ")}. Set a tax role on it in the chart of accounts.
            </p>
          )}
          {fixes.length > 0 && <p className="text-xs text-muted-foreground">After adding tax lines, use “=” on the receivable, payable or cash line to rebalance.</p>}
        </Card>
      )}

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
