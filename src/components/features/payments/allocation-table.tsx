"use client";

import { autoAllocate, type OpenDocument } from "@/lib/payments";
import { centsToDecimal, formatCents, parseAmount } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyCell, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";

/** Editable amounts per open invoice/bill (as strings), with an "oldest first" helper. */
export function AllocationTable({ docs, values, onChange, available, label }: {
  docs: OpenDocument[];
  values: Record<number, string>;
  onChange: (next: Record<number, string>) => void;
  available: number;
  label: string;
}) {
  const applied = Object.values(values).reduce((s, v) => s + (parseAmount(v) ?? 0), 0);
  if (docs.length === 0) return <p className="px-4 py-3 text-sm text-muted-foreground">No open {label}s for this contact. The whole amount will stay unapplied until you allocate it.</p>;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 px-4 py-2">
        <p className="text-sm text-muted-foreground">Open {label}s</p>
        <Button type="button" size="sm" variant="outline" onClick={() => {
          const auto = autoAllocate(available, docs);
          onChange(Object.fromEntries(Object.entries(auto).map(([id, c]) => [id, centsToDecimal(c)])));
        }}>Apply oldest first</Button>
      </div>
      <Table>
        <THead><TR><TH>{label === "invoice" ? "Invoice" : "Bill"}</TH><TH>Due</TH><TH className="text-right">Balance</TH><TH className="w-40 text-right">Apply</TH></TR></THead>
        <TBody>
          {docs.map((d) => (
            <TR key={d.id}>
              <TD className="font-mono">{d.number}</TD>
              <TD>{formatDate(d.due_date)}</TD>
              <MoneyCell>{formatCents(d.balance_due)}</MoneyCell>
              <TD><Input aria-label={`Apply to ${d.number}`} inputMode="decimal" className="h-8 text-right font-mono" placeholder="0.00"
                value={values[d.id] ?? ""} onChange={(e) => onChange({ ...values, [d.id]: e.target.value })} /></TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <p className={`px-4 py-2 text-right text-sm ${applied > available ? "text-destructive" : "text-muted-foreground"}`} data-testid="allocation-summary">
        Applied {formatCents(applied)} of {formatCents(available)} · unapplied {formatCents(available - applied)}
      </p>
    </div>
  );
}

export function allocationPayload(values: Record<number, string>) {
  return Object.entries(values)
    .filter(([, v]) => (parseAmount(v) ?? 0) > 0)
    .map(([id, v]) => ({ document_id: Number(id), amount: v.replace(/,/g, "").trim() }));
}
