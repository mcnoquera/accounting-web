import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getMe, getPayments } from "@/lib/api/endpoints";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { can } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyCell, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { FilterBar, FilterField } from "@/components/features/filter-bar";
import { Pagination } from "@/components/features/pagination";

export const metadata: Metadata = { title: "Receipts & payments" };

export default async function PaymentsPage({ searchParams }: { searchParams: { direction?: string; q?: string; page?: string } }) {
  const [page, me] = await Promise.all([getPayments(searchParams), getMe()]);
  return (
    <>
      <PageHeader
        title="Receipts & payments"
        description="Money in from customers and out to suppliers, applied to invoices and bills."
        actions={can.manageBooks(me.role) && (
          <div className="flex gap-2">
            <Link href="/payments/new?type=receipt" className={buttonClass()}><Plus size={14} /> Receipt</Link>
            <Link href="/payments/new?type=payment" className={buttonClass("outline")}><Plus size={14} /> Supplier payment</Link>
          </div>
        )}
      />
      <FilterBar>
        <FilterField label="Search"><Input name="q" defaultValue={searchParams.q} placeholder="Number or reference" className="w-48" /></FilterField>
        <FilterField label="Type">
          <Select name="direction" defaultValue={searchParams.direction ?? ""} className="w-40">
            <option value="">All</option><option value="receipt">Receipts</option><option value="payment">Supplier payments</option>
          </Select>
        </FilterField>
      </FilterBar>
      <Card>
        {page.data.length === 0 ? <EmptyState title="No receipts or payments yet" /> : (
          <Table>
            <THead><TR><TH>Number</TH><TH>Date</TH><TH>Contact</TH><TH>Account</TH><TH>Status</TH><TH className="text-right">Amount</TH><TH className="text-right">Unapplied</TH></TR></THead>
            <TBody>
              {page.data.map((p) => (
                <TR key={p.id}>
                  <TD><Link href={`/payments/${p.id}`} className="font-mono font-medium text-primary hover:underline">{p.number}</Link></TD>
                  <TD>{formatDate(p.payment_date)}</TD>
                  <TD>{p.contact?.name}</TD>
                  <TD className="text-muted-foreground">{p.cash_account?.code} {p.cash_account?.name}</TD>
                  <TD><Badge tone={p.status === "voided" ? "neutral" : p.direction === "receipt" ? "success" : "info"}>{p.status === "voided" ? "voided" : p.direction}</Badge></TD>
                  <MoneyCell>{p.direction === "payment" ? `(${formatCents(p.amount)})` : formatCents(p.amount)}</MoneyCell>
                  <MoneyCell className={p.unapplied_amount ? "text-warning" : undefined}>{p.unapplied_amount ? formatCents(p.unapplied_amount) : ""}</MoneyCell>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination meta={page.meta} basePath="/payments" params={searchParams} />
      </Card>
    </>
  );
}
