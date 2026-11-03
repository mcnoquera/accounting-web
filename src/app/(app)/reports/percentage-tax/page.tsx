import type { Metadata } from "next";
import { getPercentageTax } from "@/lib/api/endpoints";
import { formatCents } from "@/lib/money";
import { formatDate, today } from "@/lib/dates";
import { monthLabel, quarterLabel, quarterOf } from "@/lib/vat";
import { cn } from "@/lib/utils";
import type { PercentageTaxBucket } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyCell, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { ExportButtons } from "@/components/features/export-buttons";
import { FilterBar, FilterField } from "@/components/features/filter-bar";

export const metadata: Metadata = { title: "Percentage tax" };

export default async function PercentageTaxPage({ searchParams }: { searchParams: { year?: string; quarter?: string } }) {
  const current = quarterOf(today());
  const year = Number(searchParams.year) || current.year;
  const quarter = Number(searchParams.quarter) || current.quarter;
  const p = await getPercentageTax({ year: String(year), quarter: String(quarter) });
  const columns: { key: string; label: string; b: PercentageTaxBucket }[] = [
    ...p.months.map((m) => ({ key: m.month, label: monthLabel(m.month), b: m })),
    { key: "total", label: "Quarter", b: p.total },
  ];
  const rows: { label: string; get: (b: PercentageTaxBucket) => number; strong?: boolean }[] = [
    { label: "Gross sales/receipts", get: (b) => b.gross },
    { label: "Less: VAT-exempt sales", get: (b) => b.exempt },
    { label: "Taxable sales/receipts", get: (b) => b.taxable },
    { label: `Percentage tax due (${p.rate}%)`, get: (b) => b.tax, strong: true },
  ];

  return (
    <>
      <PageHeader
        title="Percentage tax"
        description={`${quarterLabel(year, quarter)}: ${formatDate(p.from)} to ${formatDate(p.to)}. Posted entries only. Supports BIR Form 2551Q for non-VAT businesses.`}
        actions={<ExportButtons apiPath="/reports/percentage-tax/export" params={{ year, quarter }} />}
      />
      <FilterBar>
        <FilterField label="Year"><Input type="number" name="year" min={2000} max={2100} defaultValue={year} className="w-24" /></FilterField>
        <FilterField label="Quarter">
          <Select name="quarter" defaultValue={String(quarter)} className="w-40">
            {[1, 2, 3, 4].map((q) => <option key={q} value={q}>{quarterLabel(year, q).replace(` ${year}`, "")}</option>)}
          </Select>
        </FilterField>
      </FilterBar>

      {p.vat_registered && (
        <Alert tone="info" className="mb-4 max-w-2xl">The company is VAT-registered, so it files the VAT return (Reports → VAT summary) instead of percentage tax. Figures are shown for reference.</Alert>
      )}
      {p.vat_registered === null && (
        <Alert tone="info" className="mb-4 max-w-2xl">Complete the company profile (Settings → Company) to set VAT status and the percentage tax rate. Using {p.rate}%.</Alert>
      )}

      <Card className="max-w-4xl">
        <Table>
          <THead>
            <TR>
              <TH />
              {columns.map((c) => <TH key={c.key} className={cn("text-right", c.key === "total" && "bg-muted/40")}>{c.label}</TH>)}
            </TR>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.label} className={cn(r.strong && "border-t-2 font-semibold")}>
                <TD>{r.label}</TD>
                {columns.map((c) => <MoneyCell key={c.key} className={cn(c.key === "total" && "bg-muted/40")}>{formatCents(r.get(c.b))}</MoneyCell>)}
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
      <p className="mt-3 max-w-2xl text-xs text-muted-foreground">
        Gross sales come from revenue lines (returns and reversals reduce them; year-end closing entries are excluded). Sales tagged VAT-exempt (VATEX) are left out of the taxable amount.
        The quarter&apos;s tax is computed on the quarter total, so it can differ from the monthly figures by a centavo.
      </p>
    </>
  );
}
