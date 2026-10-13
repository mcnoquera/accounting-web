import type { Metadata } from "next";
import Link from "next/link";
import { getAccounts, getMe } from "@/lib/api/endpoints";
import { can } from "@/lib/permissions";
import { ACCOUNT_TYPES, type AccountType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { AccountForm } from "@/components/features/accounts/account-form";

export const metadata: Metadata = { title: "Chart of accounts" };

export default async function AccountsPage() {
  const [accounts, me] = await Promise.all([getAccounts(), getMe()]);
  const byType = (t: AccountType) => accounts.filter((a) => a.type === t);

  return (
    <>
      <PageHeader title="Chart of accounts" description="Every ledger account, grouped by type. Click an account to see its general ledger." />

      {can.manageBooks(me.role) && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Add account</CardTitle></CardHeader>
          <div className="px-5 pb-5"><AccountForm /></div>
        </Card>
      )}

      <div className="space-y-6">
        {ACCOUNT_TYPES.map((type) => (
          <Card key={type}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="capitalize">{type === "equity" ? "Equity" : `${type}s`}</CardTitle>
              <span className="text-xs text-muted-foreground">{byType(type).length} accounts</span>
            </CardHeader>
            <Table>
              <THead>
                <TR>
                  <TH className="w-24">Code</TH>
                  <TH>Name</TH>
                  <TH className="w-24">Status</TH>
                </TR>
              </THead>
              <TBody>
                {byType(type).map((a) => (
                  <TR key={a.id}>
                    <TD className="font-mono">{a.code}</TD>
                    <TD>
                      <Link className="text-primary hover:underline" href={`/accounts/${a.id}`}>{a.name}</Link>
                      {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                    </TD>
                    <TD>{a.is_active ? <Badge tone="success">active</Badge> : <Badge>inactive</Badge>}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        ))}
      </div>
    </>
  );
}
