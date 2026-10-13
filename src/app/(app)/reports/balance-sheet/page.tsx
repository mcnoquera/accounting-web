import type { Metadata } from "next";
import { getBalanceSheet } from "@/lib/api/endpoints";
import { formatCents } from "@/lib/money";
import { formatDate, today } from "@/lib/dates";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyCell, TBody, TD, TFoot, TR, Table } from "@/components/ui/table";
import { FilterBar, FilterField } from "@/components/features/filter-bar";
import { ReportSection } from "@/components/features/report-section";

export const metadata: Metadata = { title: "Balance sheet" };

export default async function BalanceSheetPage({ searchParams }: { searchParams: { as_of?: string } }) {
  const asOf = searchParams.as_of ?? today();
  const bs = await getBalanceSheet({ as_of: asOf });

  return (
    <>
      <PageHeader title="Balance sheet" description={`Financial position as of ${formatDate(asOf)}.`} />
      <FilterBar>
        <FilterField label="As of"><Input type="date" name="as_of" defaultValue={asOf} /></FilterField>
      </FilterBar>
      {!bs.balanced && <Alert className="mb-4">Assets do not equal liabilities plus equity.</Alert>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="self-start">
          <CardHeader><CardTitle>Assets</CardTitle></CardHeader>
          <Table>
            <TBody><ReportSection title="Assets" section={bs.assets} /></TBody>
          </Table>
        </Card>
        <Card className="self-start">
          <CardHeader><CardTitle>Liabilities &amp; equity</CardTitle></CardHeader>
          <Table>
            <TBody>
              <ReportSection title="Liabilities" section={bs.liabilities} />
              <ReportSection title="Equity" section={bs.equity} />
            </TBody>
            <TFoot>
              <TR>
                <TD>Total liabilities &amp; equity</TD>
                <MoneyCell>{formatCents(bs.total_liabilities_and_equity)}</MoneyCell>
              </TR>
            </TFoot>
          </Table>
        </Card>
      </div>
    </>
  );
}
