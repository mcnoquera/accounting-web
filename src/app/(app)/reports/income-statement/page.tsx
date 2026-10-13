import type { Metadata } from "next";
import { getIncomeStatement } from "@/lib/api/endpoints";
import { formatCents } from "@/lib/money";
import { formatDate, startOfYear, today } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyCell, TBody, TD, TFoot, TR, Table } from "@/components/ui/table";
import { FilterBar, FilterField } from "@/components/features/filter-bar";
import { ReportSection } from "@/components/features/report-section";

export const metadata: Metadata = { title: "Income statement" };

export default async function IncomeStatementPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const from = searchParams.from ?? startOfYear();
  const to = searchParams.to ?? today();
  const is = await getIncomeStatement({ from, to });

  return (
    <>
      <PageHeader title="Income statement" description={`Profit and loss from ${formatDate(from)} to ${formatDate(to)}.`} />
      <FilterBar>
        <FilterField label="From"><Input type="date" name="from" defaultValue={from} /></FilterField>
        <FilterField label="To"><Input type="date" name="to" defaultValue={to} /></FilterField>
      </FilterBar>
      <Card className="max-w-2xl">
        <Table>
          <TBody>
            <ReportSection title="Revenue" section={is.revenue} />
            <ReportSection title="Expenses" section={is.expenses} />
          </TBody>
          <TFoot>
            <TR>
              <TD>Net {is.net_income < 0 ? "loss" : "income"}</TD>
              <MoneyCell className={cn(is.net_income < 0 && "text-destructive")}>{formatCents(is.net_income)}</MoneyCell>
            </TR>
          </TFoot>
        </Table>
      </Card>
    </>
  );
}
