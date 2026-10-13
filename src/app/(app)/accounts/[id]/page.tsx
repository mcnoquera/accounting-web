import Link from "next/link";
import { getAccountLedger, getMe } from "@/lib/api/endpoints";
import { formatCents } from "@/lib/money";
import { formatDate, startOfYear, today } from "@/lib/dates";
import { can } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyCell, TBody, TD, TFoot, TH, THead, TR, Table } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar, FilterField } from "@/components/features/filter-bar";
import { AccountForm } from "@/components/features/accounts/account-form";
import { DeleteAccount } from "@/components/features/accounts/delete-account";

export default async function AccountLedgerPage({ params, searchParams }: { params: { id: string }; searchParams: { from?: string; to?: string } }) {
  const from = searchParams.from ?? startOfYear();
  const to = searchParams.to ?? today();
  const [ledger, me] = await Promise.all([getAccountLedger(params.id, { from, to }), getMe()]);
  const { account } = ledger;

  return (
    <>
      <PageHeader
        title={`${account.code} · ${account.name}`}
        description="General ledger: every posted line hitting this account, with a running balance in its normal direction."
        actions={<Badge className="text-sm" tone={account.is_active ? "success" : "neutral"}>{account.type}</Badge>}
      />

      <FilterBar>
        <FilterField label="From"><Input type="date" name="from" defaultValue={from} /></FilterField>
        <FilterField label="To"><Input type="date" name="to" defaultValue={to} /></FilterField>
      </FilterBar>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Date</TH>
              <TH>Entry</TH>
              <TH>Description</TH>
              <TH className="text-right">Debit</TH>
              <TH className="text-right">Credit</TH>
              <TH className="text-right">Balance</TH>
            </TR>
          </THead>
          <TBody>
            <TR className="bg-muted/40">
              <TD colSpan={5} className="text-muted-foreground">Opening balance</TD>
              <MoneyCell>{formatCents(ledger.opening_balance)}</MoneyCell>
            </TR>
            {ledger.rows.map((r, i) => (
              <TR key={`${r.entry_id}-${i}`}>
                <TD className="whitespace-nowrap">{formatDate(r.entry_date)}</TD>
                <TD><Link className="font-mono text-primary hover:underline" href={`/journal/${r.entry_id}`}>{r.number}</Link></TD>
                <TD>{r.description}{r.memo && <span className="text-muted-foreground"> — {r.memo}</span>}</TD>
                <MoneyCell>{r.debit ? formatCents(r.debit) : ""}</MoneyCell>
                <MoneyCell>{r.credit ? formatCents(r.credit) : ""}</MoneyCell>
                <MoneyCell>{formatCents(r.balance)}</MoneyCell>
              </TR>
            ))}
          </TBody>
          <TFoot>
            <TR>
              <TD colSpan={5}>Closing balance</TD>
              <MoneyCell>{formatCents(ledger.closing_balance)}</MoneyCell>
            </TR>
          </TFoot>
        </Table>
        {ledger.rows.length === 0 && <EmptyState title="No posted activity in this period" />}
      </Card>

      {can.manageBooks(me.role) && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Edit account</CardTitle></CardHeader>
          <div className="space-y-4 px-5 pb-5">
            <AccountForm account={account} />
            <div className="border-t pt-4">
              <p className="mb-2 text-xs text-muted-foreground">Accounts with journal activity can’t be deleted; deactivate them instead.</p>
              <DeleteAccount id={account.id} />
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
