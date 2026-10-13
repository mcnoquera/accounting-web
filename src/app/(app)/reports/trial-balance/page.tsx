import type { Metadata } from "next";
import Link from "next/link";
import { getTrialBalance } from "@/lib/api/endpoints";
import { formatCents } from "@/lib/money";
import { formatDate, today } from "@/lib/dates";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyCell, TBody, TD, TFoot, TH, THead, TR, Table } from "@/components/ui/table";
import { FilterBar, FilterField } from "@/components/features/filter-bar";

export const metadata: Metadata = { title: "Trial balance" };

export default async function TrialBalancePage({ searchParams }: { searchParams: { as_of?: string } }) {
  const asOf = searchParams.as_of ?? today();
  const tb = await getTrialBalance({ as_of: asOf });

  return (
    <>
      <PageHeader title="Trial balance" description={`Net debit or credit balance of every account as of ${formatDate(asOf)}. Posted entries only.`} />
      <FilterBar>
        <FilterField label="As of"><Input type="date" name="as_of" defaultValue={asOf} /></FilterField>
      </FilterBar>
      {!tb.balanced && <Alert className="mb-4">Debits and credits do not agree. Investigate before relying on these figures.</Alert>}
      <Card>
        <Table>
          <THead>
            <TR>
              <TH className="w-24">Code</TH>
              <TH>Account</TH>
              <TH>Type</TH>
              <TH className="text-right">Debit</TH>
              <TH className="text-right">Credit</TH>
            </TR>
          </THead>
          <TBody>
            {tb.rows.map((r) => (
              <TR key={r.account_id}>
                <TD className="font-mono">{r.code}</TD>
                <TD><Link className="hover:underline" href={`/accounts/${r.account_id}?to=${asOf}`}>{r.name}</Link></TD>
                <TD><Badge>{r.type}</Badge></TD>
                <MoneyCell>{r.debit ? formatCents(r.debit) : ""}</MoneyCell>
                <MoneyCell>{r.credit ? formatCents(r.credit) : ""}</MoneyCell>
              </TR>
            ))}
          </TBody>
          <TFoot>
            <TR>
              <TD colSpan={3}>
                Totals <Badge tone={tb.balanced ? "success" : "danger"} className="ml-2">{tb.balanced ? "balanced" : "out of balance"}</Badge>
              </TD>
              <MoneyCell>{formatCents(tb.totals.debit)}</MoneyCell>
              <MoneyCell>{formatCents(tb.totals.credit)}</MoneyCell>
            </TR>
          </TFoot>
        </Table>
      </Card>
    </>
  );
}
