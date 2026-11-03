import type { Metadata } from "next";
import Link from "next/link";
import { getWithholding } from "@/lib/api/endpoints";
import { formatCents } from "@/lib/money";
import { formatDate, today } from "@/lib/dates";
import { monthLabel, quarterLabel, quarterOf } from "@/lib/vat";
import type { WithholdingParty } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyCell, TBody, TD, TFoot, TH, THead, TR, Table } from "@/components/ui/table";
import { ExportButtons } from "@/components/features/export-buttons";
import { FilterBar, FilterField } from "@/components/features/filter-bar";

export const metadata: Metadata = { title: "Withholding tax" };

export default async function WithholdingPage({ searchParams }: { searchParams: { year?: string; quarter?: string } }) {
  const current = quarterOf(today());
  const year = Number(searchParams.year) || current.year;
  const quarter = Number(searchParams.quarter) || current.quarter;
  const w = await getWithholding({ year: String(year), quarter: String(quarter) });
  const params = { year, quarter };
  const months = w.withheld.months;
  const mismatch = Math.abs(w.withheld.booked - w.withheld.total.tax) > 100 * Math.max(w.withheld.payees.length, 1);

  return (
    <>
      <PageHeader
        title="Withholding tax"
        description={`${quarterLabel(year, quarter)}: ${formatDate(w.from)} to ${formatDate(w.to)}. Posted entries only, from the ATCs on purchase and sale lines.`}
        actions={<ExportButtons apiPath="/reports/withholding/export" params={params} />}
      />
      <FilterBar>
        <FilterField label="Year"><Input type="number" name="year" min={2000} max={2100} defaultValue={year} className="w-24" /></FilterField>
        <FilterField label="Quarter">
          <Select name="quarter" defaultValue={String(quarter)} className="w-40">
            {[1, 2, 3, 4].map((q) => <option key={q} value={q}>{quarterLabel(year, q).replace(` ${year}`, "")}</option>)}
          </Select>
        </FilterField>
      </FilterBar>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Withheld from suppliers</CardTitle></CardHeader>
          {w.withheld.by_atc.length === 0 ? (
            <EmptyState title="No withholding this quarter" hint="Put a withholding code (ATC) on the expense line of a purchase to track it here." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>ATC</TH><TH>Nature of income payment</TH><TH className="text-right">Rate</TH>
                  {months.map((m) => <TH key={m.month} className="text-right">{monthLabel(m.month)}</TH>)}
                  <TH className="text-right">Quarter base</TH><TH className="text-right">Quarter tax</TH>
                </TR>
              </THead>
              <TBody>
                {w.withheld.by_atc.map((r) => (
                  <TR key={r.atc}>
                    <TD className="font-mono font-medium">{r.atc}</TD>
                    <TD className="max-w-xs text-muted-foreground">{r.description}</TD>
                    <TD className="text-right tabular-nums">{r.rate}%</TD>
                    {r.months.map((m) => <MoneyCell key={m.month}>{m.tax ? formatCents(m.tax) : ""}</MoneyCell>)}
                    <MoneyCell>{formatCents(r.base)}</MoneyCell>
                    <MoneyCell className="font-medium">{formatCents(r.tax)}</MoneyCell>
                  </TR>
                ))}
              </TBody>
              <TFoot>
                <TR>
                  <TD colSpan={3}>Tax withheld</TD>
                  {months.map((m) => <MoneyCell key={m.month}>{formatCents(m.tax)}</MoneyCell>)}
                  <MoneyCell>{formatCents(w.withheld.total.base)}</MoneyCell>
                  <MoneyCell>{formatCents(w.withheld.total.tax)}</MoneyCell>
                </TR>
              </TFoot>
            </Table>
          )}
          <CardContent className="space-y-2 pt-4 text-sm text-muted-foreground">
            <p>
              Monthly remittance (Form 0619-E) for {months.slice(0, 2).map((m) => `${monthLabel(m.month)}: ${formatCents(m.tax)}`).join(", ")}.
              {" "}Quarterly return (Form 1601-EQ): {formatCents(w.withheld.total.tax)}, less the 0619-E remittances.
            </p>
            {mismatch && (
              <Alert>Withholding tax payable on coded entries is {formatCents(w.withheld.booked)}, which differs from the {formatCents(w.withheld.total.tax)} the ATCs imply. Check entries posted before codes were used.</Alert>
            )}
          </CardContent>
        </Card>

        <PartyTable
          title="Payees (QAP)"
          who="Supplier"
          rows={w.withheld.payees}
          total={w.withheld.total}
          actions={<ExportButtons apiPath="/reports/withholding-payees/export" params={params} formats={["csv"]} />}
          note={w.withheld.payees_without_contact > 0
            ? `${w.withheld.payees_without_contact} line(s) have no supplier. Put the supplier on the expense or payable line so the payee list is complete.`
            : undefined}
        />

        <PartyTable
          title="Withheld from us by customers (Forms 2307)"
          who="Customer"
          rows={w.received.by_customer}
          total={w.received.total}
          note={w.received.booked !== w.received.total.tax ? `Creditable withholding tax booked on coded entries: ${formatCents(w.received.booked)}.` : undefined}
        />

        {w.other_activity.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Other activity on withholding accounts</CardTitle></CardHeader>
            <CardContent className="pb-2 text-sm text-muted-foreground">Entries without an ATC, such as remittances to the BIR or applying 2307 credits. Not included above.</CardContent>
            <Table>
              <THead><TR><TH>Entry</TH><TH>Date</TH><TH>Description</TH><TH>Account</TH><TH className="text-right">Amount</TH></TR></THead>
              <TBody>
                {w.other_activity.map((o) => (
                  <TR key={`${o.entry_id}-${o.account_code}`}>
                    <TD><Link className="font-mono text-primary hover:underline" href={`/journal/${o.entry_id}`}>{o.number}</Link></TD>
                    <TD>{formatDate(o.entry_date)}</TD>
                    <TD className="text-muted-foreground">{o.description}</TD>
                    <TD className="font-mono">{o.account_code}</TD>
                    <MoneyCell>{formatCents(o.amount)}</MoneyCell>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </div>
    </>
  );
}

function PartyTable({ title, who, rows, total, actions, note }: {
  title: string; who: string; rows: WithholdingParty[]; total: { base: number; tax: number }; actions?: React.ReactNode; note?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2"><CardTitle>{title}</CardTitle>{actions}</CardHeader>
      {note && <div className="px-5 pb-3"><Alert tone="info">{note}</Alert></div>}
      {rows.length === 0 ? (
        <EmptyState title="Nothing this quarter" />
      ) : (
        <Table>
          <THead><TR><TH>{who}</TH><TH>TIN</TH><TH>ATC</TH><TH className="text-right">Income payment</TH><TH className="text-right">Tax withheld</TH></TR></THead>
          <TBody>
            {rows.map((r) => (
              <TR key={`${r.contact_id ?? 0}-${r.atc}`}>
                <TD>{r.contact_id ? <Link className="text-primary hover:underline" href={`/contacts/${r.contact_id}`}>{r.name}</Link> : <span className="text-destructive">No {who.toLowerCase()}</span>}</TD>
                <TD className="font-mono text-muted-foreground">{r.tin ?? "—"}</TD>
                <TD className="font-mono" title={r.description}>{r.atc} <span className="text-xs text-muted-foreground">{r.rate}%</span></TD>
                <MoneyCell>{formatCents(r.base)}</MoneyCell>
                <MoneyCell>{formatCents(r.tax)}</MoneyCell>
              </TR>
            ))}
          </TBody>
          <TFoot><TR><TD colSpan={3}>Total</TD><MoneyCell>{formatCents(total.base)}</MoneyCell><MoneyCell>{formatCents(total.tax)}</MoneyCell></TR></TFoot>
        </Table>
      )}
    </Card>
  );
}
