import type { Metadata } from "next";
import Link from "next/link";
import { getVatSummary } from "@/lib/api/endpoints";
import { formatCents } from "@/lib/money";
import { formatDate, today } from "@/lib/dates";
import { monthLabel, quarterLabel, quarterOf, vatReconciles } from "@/lib/vat";
import { cn } from "@/lib/utils";
import type { VatBucket } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyCell, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { FilterBar, FilterField } from "@/components/features/filter-bar";

export const metadata: Metadata = { title: "VAT summary" };

type Row = { label: string; value: (b: VatBucket) => number; strong?: boolean; indent?: boolean };

const ROWS: { title: string; rows: Row[] }[] = [
  {
    title: "Sales",
    rows: [
      { label: "Vatable sales", value: (b) => b.sales.vatable, indent: true },
      { label: "Zero-rated sales", value: (b) => b.sales.zero_rated, indent: true },
      { label: "Exempt sales", value: (b) => b.sales.exempt, indent: true },
      { label: "Total sales", value: (b) => b.sales.total },
      { label: "Output VAT", value: (b) => b.output_vat, strong: true },
    ],
  },
  {
    title: "Purchases",
    rows: [
      { label: "Vatable purchases", value: (b) => b.purchases.vatable, indent: true },
      { label: "Zero-rated purchases", value: (b) => b.purchases.zero_rated, indent: true },
      { label: "Exempt purchases", value: (b) => b.purchases.exempt, indent: true },
      { label: "Total purchases", value: (b) => b.purchases.total },
      { label: "Input VAT", value: (b) => b.input_vat, strong: true },
    ],
  },
];

export default async function VatSummaryPage({ searchParams }: { searchParams: { year?: string; quarter?: string } }) {
  const current = quarterOf(today());
  const year = Number(searchParams.year) || current.year;
  const quarter = Number(searchParams.quarter) || current.quarter;
  const vat = await getVatSummary({ year: String(year), quarter: String(quarter) });
  const columns: { key: string; label: string; bucket: VatBucket }[] = [
    ...vat.months.map((m) => ({ key: m.month!, label: monthLabel(m.month!), bucket: m })),
    { key: "total", label: "Quarter", bucket: vat.total },
  ];
  const net = vat.total.net_vat_payable;
  const reconciles = vatReconciles(vat.total, 3);

  return (
    <>
      <PageHeader
        title="VAT summary"
        description={`${quarterLabel(year, quarter)}: ${formatDate(vat.from)} to ${formatDate(vat.to)}. Posted entries only, from the VAT codes on sale and purchase lines. Supports BIR Form 2550Q.`}
      />
      <FilterBar>
        <FilterField label="Year"><Input type="number" name="year" min={2000} max={2100} defaultValue={year} className="w-24" /></FilterField>
        <FilterField label="Quarter">
          <Select name="quarter" defaultValue={String(quarter)} className="w-40">
            {[1, 2, 3, 4].map((q) => <option key={q} value={q}>{quarterLabel(year, q).replace(` ${year}`, "")}</option>)}
          </Select>
        </FilterField>
      </FilterBar>

      {vat.vat_registered === false ? (
        <Alert tone="info" className="max-w-2xl">
          The company isn&apos;t VAT-registered (Settings → Company), so it doesn&apos;t file a VAT return. Non-VAT businesses
          generally file percentage tax instead; that summary isn&apos;t available yet.
        </Alert>
      ) : (
        <div className="space-y-6">
          {vat.vat_registered === null && (
            <Alert tone="info">Complete the company profile (Settings → Company) to record whether the business is VAT-registered.</Alert>
          )}

          <Card>
            <Table>
              <THead>
                <TR>
                  <TH />
                  {columns.map((c) => <TH key={c.key} className={cn("text-right", c.key === "total" && "bg-muted/40")}>{c.label}</TH>)}
                </TR>
              </THead>
              <TBody>
                {ROWS.map((section) => (
                  <SectionRows key={section.title} title={section.title} rows={section.rows} columns={columns} />
                ))}
                <TR className="border-t-2 font-semibold">
                  <TD>Net VAT payable <span className="font-normal text-muted-foreground">(negative: excess input VAT)</span></TD>
                  {columns.map((c) => (
                    <MoneyCell key={c.key} className={cn(c.key === "total" && "bg-muted/40", c.bucket.net_vat_payable < 0 && "text-success")}>
                      {formatCents(c.bucket.net_vat_payable)}
                    </MoneyCell>
                  ))}
                </TR>
              </TBody>
            </Table>
          </Card>

          <Alert tone={net > 0 ? "info" : "success"} className="max-w-2xl">
            {net > 0
              ? <>VAT payable for the quarter: <strong className="font-mono">{formatCents(net)}</strong>.</>
              : net < 0
                ? <>Excess input VAT for the quarter: <strong className="font-mono">{formatCents(-net)}</strong>, carried over to the next quarter.</>
                : <>No net VAT for the quarter.</>}
          </Alert>

          <Card>
            <CardHeader><CardTitle>Reconciliation</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <dl className="grid max-w-2xl grid-cols-[1fr_auto_auto] gap-x-6 gap-y-1 font-mono tabular-nums">
                <dt className="font-sans text-muted-foreground" />
                <dd className="text-right font-sans text-xs text-muted-foreground">From codes</dd>
                <dd className="text-right font-sans text-xs text-muted-foreground">Booked</dd>
                <dt className="font-sans">Output VAT</dt>
                <dd className="text-right">{formatCents(vat.total.output_vat_from_codes)}</dd>
                <dd className="text-right">{formatCents(vat.total.output_vat)}</dd>
                <dt className="font-sans">Input VAT</dt>
                <dd className="text-right">{formatCents(vat.total.input_vat_from_codes)}</dd>
                <dd className="text-right">{formatCents(vat.total.input_vat)}</dd>
              </dl>
              {!reconciles && (
                <Alert>Booked VAT differs from what the codes imply by more than rounding. Check entries posted before tax codes were in use.</Alert>
              )}

              {vat.other_vat_activity.length > 0 ? (
                <div className="space-y-2">
                  <Alert tone="info">
                    These entries touch a VAT account but carry no VAT code, so they&apos;re not in the summary above. Quarter-end settlements
                    (moving VAT to VAT payable) belong here; anything else is probably a sale or purchase missing its VAT code.
                  </Alert>
                  <Table>
                    <THead>
                      <TR><TH>Entry</TH><TH>Date</TH><TH>Description</TH><TH>Account</TH><TH className="text-right">Amount</TH></TR>
                    </THead>
                    <TBody>
                      {vat.other_vat_activity.map((o) => (
                        <TR key={`${o.entry_id}-${o.account_id}`}>
                          <TD><Link className="font-mono text-primary hover:underline" href={`/journal/${o.entry_id}`}>{o.number}</Link></TD>
                          <TD>{formatDate(o.entry_date)}</TD>
                          <TD className="text-muted-foreground">{o.description}</TD>
                          <TD><span className="font-mono text-muted-foreground">{o.account_code}</span> {o.account_name}</TD>
                          <MoneyCell>{formatCents(o.amount)}</MoneyCell>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No other activity on VAT accounts this quarter.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function SectionRows({ title, rows, columns }: { title: string; rows: Row[]; columns: { key: string; bucket: VatBucket }[] }) {
  return (
    <>
      <TR className="bg-muted/30">
        <TD colSpan={columns.length + 1} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</TD>
      </TR>
      {rows.map((r) => (
        <TR key={r.label} className={cn(r.strong && "font-medium")}>
          <TD className={cn(r.indent && "pl-8")}>{r.label}</TD>
          {columns.map((c) => (
            <MoneyCell key={c.key} className={cn(c.key === "total" && "bg-muted/40")}>{formatCents(r.value(c.bucket))}</MoneyCell>
          ))}
        </TR>
      ))}
    </>
  );
}
