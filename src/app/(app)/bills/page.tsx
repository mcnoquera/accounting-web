import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getBills, getMe } from "@/lib/api/endpoints";
import { BILL_STATUS_LABEL } from "@/lib/bills";
import { INVOICE_STATUS_TONE, isOverdue } from "@/lib/invoices";
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

export const metadata: Metadata = { title: "Supplier bills" };

export default async function BillsPage({ searchParams }: { searchParams: { status?: string; q?: string; page?: string } }) {
  const [page, me] = await Promise.all([getBills(searchParams), getMe()]);
  const now = today();
  return (
    <>
      <PageHeader
        title="Supplier bills"
        description="Recording a bill posts expenses, input VAT and withholding, and what you owe the supplier."
        actions={can.manageBooks(me.role) && <Link href="/bills/new" className={buttonClass()}><Plus size={14} /> New bill</Link>}
      />
      <FilterBar>
        <FilterField label="Search"><Input name="q" defaultValue={searchParams.q} placeholder="Number or supplier invoice no." className="w-56" /></FilterField>
        <FilterField label="Status">
          <Select name="status" defaultValue={searchParams.status ?? ""} className="w-36">
            <option value="">All</option><option value="draft">Draft</option><option value="open">Open (unpaid)</option>
            <option value="overdue">Overdue</option><option value="paid">Paid</option><option value="voided">Voided</option>
          </Select>
        </FilterField>
      </FilterBar>
      <Card>
        {page.data.length === 0 ? <EmptyState title="No bills" hint="Record a supplier's invoice to track what you owe." /> : (
          <Table>
            <THead><TR><TH>Number</TH><TH>Supplier invoice</TH><TH>Date</TH><TH>Supplier</TH><TH>Due</TH><TH>Status</TH><TH className="text-right">Amount due</TH><TH className="text-right">Balance</TH></TR></THead>
            <TBody>
              {page.data.map((b) => (
                <TR key={b.id}>
                  <TD><Link href={`/bills/${b.id}`} className="font-mono font-medium text-primary hover:underline">{b.number ?? "Draft"}</Link></TD>
                  <TD className="font-mono text-muted-foreground">{b.supplier_invoice_number}</TD>
                  <TD>{formatDate(b.bill_date)}</TD>
                  <TD>{b.contact?.name}</TD>
                  <TD className={isOverdue(b, now) ? "font-medium text-destructive" : undefined}>{formatDate(b.due_date)}</TD>
                  <TD><Badge tone={INVOICE_STATUS_TONE[b.status]}>{BILL_STATUS_LABEL[b.status]}</Badge>{isOverdue(b, now) && <Badge tone="danger" className="ml-1">overdue</Badge>}</TD>
                  <MoneyCell>{formatCents(b.amount_due)}</MoneyCell>
                  <MoneyCell>{b.balance_due ? formatCents(b.balance_due) : ""}</MoneyCell>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination meta={page.meta} basePath="/bills" params={searchParams} />
      </Card>
    </>
  );
}
