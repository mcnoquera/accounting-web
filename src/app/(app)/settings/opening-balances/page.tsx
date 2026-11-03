import type { Metadata } from "next";
import Link from "next/link";
import { getAccounts, getContacts, getMe, getOpeningBalances } from "@/lib/api/endpoints";
import { groupIds } from "@/lib/accounts";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { can } from "@/lib/permissions";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { NoAccess } from "@/components/features/no-access";
import { OpeningBalanceForm } from "@/components/features/imports/opening-balance-form";

export const metadata: Metadata = { title: "Opening balances" };

export default async function OpeningBalancesPage({ searchParams }: { searchParams: { done?: string } }) {
  const me = await getMe();
  if (!can.closePeriods(me.role)) return <NoAccess what="opening balances" hint="Admins and accountants enter opening balances." />;
  const [existing, accounts, customers, suppliers] = await Promise.all([
    getOpeningBalances(), getAccounts({ active: "1" }), getContacts({ type: "customer", active: "1" }), getContacts({ type: "supplier", active: "1" }),
  ]);
  const groups = groupIds(accounts);
  const detail = accounts.filter((a) => !groups.has(a.id));

  return (
    <>
      <PageHeader title="Opening balances" description="Your balances on the day you start using Ledgerly. Receivables and payables are entered per customer and supplier, so aging and payments work right away." />
      {searchParams.done === "saved" && <Alert tone="success" className="mb-4">Opening balances saved and every month before cut-over closed.</Alert>}
      {existing && (
        <Alert tone="info" className="mb-4">
          Opening balances as of {formatDate(existing.as_of)} are in entry <Link className="font-mono underline" href={`/journal/${existing.journal_entry.id}`}>{existing.journal_entry.number}</Link>
          {" "}({existing.receivables.length} opening invoice(s), {existing.payables.length} opening bill(s); difference in {existing.equity_account.code} {existing.equity_account.name}).
          {existing.receivables.length + existing.payables.length > 0 && <> Open receivables: {formatCents(existing.receivables.reduce((s, r) => s + r.total_amount - r.amount_paid, 0))}.</>}
          {!existing.replaceable && <> They can no longer be replaced: an opening invoice or bill has payments, or the cut-over month is closed.</>}
        </Alert>
      )}
      {(!existing || existing.replaceable)
        ? <OpeningBalanceForm accounts={detail} customers={customers} suppliers={suppliers} existing={existing} />
        : null}
    </>
  );
}
