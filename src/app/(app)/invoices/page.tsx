import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getInvoices, getMe } from "@/lib/api/endpoints";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, isOverdue } from "@/lib/invoices";
import { formatCents } from "@/lib/money";
import { formatDate, today } from "@/lib/dates";
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

export const metadata: Metadata = { title: "Sales invoices" };

type Search = { status?: string; q?: string; contact_id?: string; page?: string };

export default async function InvoicesPage({ searchParams }: { searchParams: Search }) {
  const [page, me] = await Promise.all([getInvoices(searchParams), getMe()]);
  const now = today();

  return (
    <>
      <PageHeader
        title="Sales invoices"
        description="Issuing an invoice posts it to the ledger: receivable from the customer, revenue and output VAT."
        actions={can.manageBooks(me.role) && <Link href="/invoices/new" className={buttonClass()}><Plus size={14} /> New invoice</Link>}
      />
      <FilterBar>
        <FilterField label="Search"><Input name="q" defaultValue={searchParams.q} placeholder="Number or reference" className="w-48" /></FilterField>
        <FilterField label="Status">
          <Select name="status" defaultValue={searchParams.status ?? ""} className="w-36">
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="open">Open (unpaid)</option>
            <option value="overdue">Overdue</option>
            <option value="paid">Paid</option>
            <option value="voided">Voided</option>
          </Select>
        </FilterField>
      </FilterBar>
      <Card>
        {page.data.length === 0 ? (
          <EmptyState title="No invoices" hint="Create an invoice for a customer to bill them." />
        ) : (
          <Table>
            <THead>
              <TR><TH>Number</TH><TH>Date</TH><TH>Customer</TH><TH>Due</TH><TH>Status</TH><TH className="text-right">Total</TH><TH className="text-right">Balance due</TH></TR>
            </THead>
            <TBody>
              {page.data.map((inv) => (
                <TR key={inv.id}>
                  <TD><Link href={`/invoices/${inv.id}`} className="font-mono font-medium text-primary hover:underline">{inv.number ?? "Draft"}</Link></TD>
                  <TD>{formatDate(inv.invoice_date)}</TD>
                  <TD>{inv.contact?.name}</TD>
                  <TD className={isOverdue(inv, now) ? "font-medium text-destructive" : undefined}>{formatDate(inv.due_date)}</TD>
                  <TD><Badge tone={INVOICE_STATUS_TONE[inv.status]}>{INVOICE_STATUS_LABEL[inv.status]}</Badge>{isOverdue(inv, now) && <Badge tone="danger" className="ml-1">overdue</Badge>}</TD>
                  <MoneyCell>{formatCents(inv.total_amount)}</MoneyCell>
                  <MoneyCell>{inv.balance_due ? formatCents(inv.balance_due) : ""}</MoneyCell>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination meta={page.meta} basePath="/invoices" params={searchParams} />
      </Card>
    </>
  );
}
