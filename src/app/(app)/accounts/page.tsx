import type { Metadata } from "next";
import Link from "next/link";
import { getAccounts, getMe } from "@/lib/api/endpoints";
import { buildAccountTree } from "@/lib/accounts";
import { can } from "@/lib/permissions";
import { ACCOUNT_TYPES, type AccountType } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { AccountForm } from "@/components/features/accounts/account-form";
import { LoadDefaults } from "@/components/features/accounts/load-defaults";
import { FilterBar, FilterField } from "@/components/features/filter-bar";

export const metadata: Metadata = { title: "Chart of accounts" };

type Search = { q?: string; type?: string; status?: string; loaded?: string };

const TYPE_LABEL: Record<AccountType, string> = {
  asset: "Assets", liability: "Liabilities", equity: "Equity", revenue: "Revenue", expense: "Expenses",
};

export default async function AccountsPage({ searchParams }: { searchParams: Search }) {
  const [accounts, me] = await Promise.all([getAccounts(), getMe()]);
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const status = searchParams.status ?? "";
  const filtering = q !== "" || status !== "";

  const matches = accounts.filter(
    (a) =>
      (!q || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)) &&
      (status === "" || (status === "active") === a.is_active),
  );
  const types = ACCOUNT_TYPES.filter((t) => !searchParams.type || t === searchParams.type);
  // Build the tree from the full list so group flags stay correct, then keep matching rows.
  const tree = buildAccountTree(accounts);
  const matchIds = new Set(matches.map((a) => a.id));
  const rowsFor = (t: AccountType) => tree.filter((r) => r.account.type === t && matchIds.has(r.account.id));
  const canEdit = can.manageBooks(me.role);

  return (
    <>
      <PageHeader title="Chart of accounts" description="Every ledger account, grouped by type. Entries post to detail accounts; group accounts total their sub-accounts." />

      {searchParams.loaded === "1" && accounts.length > 0 && (
        <Alert tone="success" className="mb-6">
          Philippine starter chart loaded: {accounts.length} accounts. Rename, add or deactivate accounts to fit your business.
        </Alert>
      )}

      {accounts.length === 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Set up your chart of accounts</CardTitle></CardHeader>
          <CardContent>
            {canEdit ? <LoadDefaults /> : <p className="text-sm text-muted-foreground">No accounts yet. An accountant or admin can load the starter chart.</p>}
          </CardContent>
        </Card>
      )}

      {canEdit && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Add account</CardTitle></CardHeader>
          <div className="px-5 pb-5"><AccountForm accounts={accounts} /></div>
        </Card>
      )}

      {accounts.length > 0 && (
        <FilterBar>
          <FilterField label="Search"><Input name="q" defaultValue={searchParams.q} placeholder="Code or name" className="w-56" /></FilterField>
          <FilterField label="Type">
            <Select name="type" defaultValue={searchParams.type ?? ""} className="w-36">
              <option value="">All types</option>
              {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </Select>
          </FilterField>
          <FilterField label="Status">
            <Select name="status" defaultValue={status} className="w-32">
              <option value="">Any</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FilterField>
          {(filtering || searchParams.type) && <Link href="/accounts" className="pb-2 text-sm text-muted-foreground hover:underline">Clear</Link>}
        </FilterBar>
      )}

      <div className="space-y-6">
        {types.map((type) => {
          const rows = rowsFor(type);
          if (accounts.length > 0 && rows.length === 0 && (filtering || searchParams.type)) return null;
          return (
            <Card key={type}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{TYPE_LABEL[type]}</CardTitle>
                <span className="text-xs text-muted-foreground">{rows.length} {rows.length === 1 ? "account" : "accounts"} · normal balance {type === "asset" || type === "expense" ? "debit" : "credit"}</span>
              </CardHeader>
              <Table>
                <THead>
                  <TR>
                    <TH className="w-28">Code</TH>
                    <TH>Name</TH>
                    <TH className="w-28">Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map(({ account: a, depth, isGroup }) => (
                    <TR key={a.id}>
                      <TD className="font-mono">{a.code}</TD>
                      <TD>
                        <div style={{ paddingLeft: `${(filtering ? 0 : depth) * 1.25}rem` }}>
                          <Link className={isGroup ? "font-semibold hover:underline" : "text-primary hover:underline"} href={`/accounts/${a.id}`}>{a.name}</Link>
                          {isGroup && <Badge className="ml-2">group</Badge>}
                          {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                        </div>
                      </TD>
                      <TD>{a.is_active ? <Badge tone="success">active</Badge> : <Badge>inactive</Badge>}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              {rows.length === 0 && <EmptyState title="No accounts of this type yet" />}
            </Card>
          );
        })}
      </div>
    </>
  );
}
