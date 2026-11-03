import type { Metadata } from "next";
import Link from "next/link";
import { getAging } from "@/lib/api/endpoints";
import { AGING_COLUMNS } from "@/lib/contacts";
import { formatCents } from "@/lib/money";
import { formatDate, today } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { ControlType } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyCell, TBody, TD, TFoot, TH, THead, TR, Table } from "@/components/ui/table";
import { ExportButtons } from "@/components/features/export-buttons";
import { FilterBar, FilterField } from "@/components/features/filter-bar";

export const metadata: Metadata = { title: "Aging" };

export default async function AgingPage({ searchParams }: { searchParams: { type?: string; as_of?: string } }) {
  const type: ControlType = searchParams.type === "payable" ? "payable" : "receivable";
  const asOf = searchParams.as_of ?? today();
  const aging = await getAging({ type, as_of: asOf });
  const who = type === "receivable" ? "Customer" : "Supplier";

  return (
    <>
      <PageHeader
        title={type === "receivable" ? "Receivables aging" : "Payables aging"}
        description={`As of ${formatDate(asOf)}, by days past due (entry date + payment terms). Payments settle the oldest charges first.`}
        actions={<ExportButtons apiPath="/reports/aging/export" params={{ type, as_of: asOf }} />}
      />
      <FilterBar>
        <input type="hidden" name="type" value={type} />
        <FilterField label="As of"><Input type="date" name="as_of" defaultValue={asOf} /></FilterField>
      </FilterBar>

      {aging.control_accounts.length === 0 && (
        <Alert tone="info" className="mb-4">
          No account is marked as a {type} control account yet. Edit the trade {type} account in the chart of accounts and set its subsidiary ledger.
        </Alert>
      )}
      {aging.unassigned !== 0 && (
        <Alert className="mb-4">
          The control account balance is {formatCents(aging.control_balance)}, but {formatCents(aging.unassigned)} is on lines without a {who.toLowerCase()} (usually from before the account was a control account).
        </Alert>
      )}

      <Card>
        {aging.rows.length === 0 ? (
          <EmptyState title={`No open ${type}s`} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{who}</TH>
                {AGING_COLUMNS.map((c) => <TH key={c.key} className="text-right">{c.label}</TH>)}
                <TH className="text-right">Total</TH>
              </TR>
            </THead>
            <TBody>
              {aging.rows.map((r) => (
                <TR key={r.contact_id}>
                  <TD>
                    <Link href={`/contacts/${r.contact_id}?type=${type}`} className="font-medium text-primary hover:underline">{r.name}</Link>
                    <span className="block text-xs text-muted-foreground">{[r.tin, `${r.payment_terms_days}-day terms`].filter(Boolean).join(" · ")}</span>
                  </TD>
                  {AGING_COLUMNS.map((c) => (
                    <MoneyCell key={c.key} className={cn(c.key === "over_90" && r[c.key] > 0 && "text-destructive")}>{r[c.key] ? formatCents(r[c.key]) : ""}</MoneyCell>
                  ))}
                  <MoneyCell className="font-medium">{formatCents(r.total)}</MoneyCell>
                </TR>
              ))}
            </TBody>
            <TFoot>
              <TR>
                <TD>Total</TD>
                {AGING_COLUMNS.map((c) => <MoneyCell key={c.key}>{formatCents(aging.totals[c.key])}</MoneyCell>)}
                <MoneyCell>{formatCents(aging.totals.total)}</MoneyCell>
              </TR>
            </TFoot>
          </Table>
        )}
      </Card>
    </>
  );
}
