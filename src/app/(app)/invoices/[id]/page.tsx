import Link from "next/link";
import { FileDown } from "lucide-react";
import { getInvoice, getMe } from "@/lib/api/endpoints";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, isOverdue } from "@/lib/invoices";
import { formatCents } from "@/lib/money";
import { formatDate, formatDateTime, today } from "@/lib/dates";
import { can } from "@/lib/permissions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyCell, TBody, TD, TFoot, TH, THead, TR, Table } from "@/components/ui/table";
import { DraftInvoiceActions, VoidInvoiceAction } from "@/components/features/invoices/invoice-actions";

export default async function InvoicePage({ params, searchParams }: { params: { id: string }; searchParams: { done?: string; issue_error?: string } }) {
  const [inv, me] = await Promise.all([getInvoice(params.id), getMe()]);
  const overdue = isOverdue(inv, today());

  return (
    <>
      <PageHeader
        title={inv.number ? `Invoice ${inv.number}` : "Draft invoice"}
        description={`${inv.contact?.name} · ${formatDate(inv.invoice_date)}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={INVOICE_STATUS_TONE[inv.status]}>{INVOICE_STATUS_LABEL[inv.status]}</Badge>
            {overdue && <Badge tone="danger">overdue</Badge>}
            <a href={`/export/sales-invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer" className={buttonClass("outline", "sm")}><FileDown size={14} /> PDF</a>
          </div>
        }
      />

      {searchParams.done === "issued" && inv.number && <Alert tone="success" className="mb-4">Invoice {inv.number} issued and posted to the ledger.</Alert>}
      {searchParams.done === "voided" && <Alert tone="success" className="mb-4">Invoice voided; its ledger entry was reversed.</Alert>}
      {searchParams.issue_error && <Alert className="mb-4">Saved as a draft, but it couldn&apos;t be issued: {searchParams.issue_error}</Alert>}
      {inv.status === "voided" && <Alert className="mb-4">Voided by {inv.voider?.name} on {formatDateTime(inv.voided_at)}: “{inv.void_reason}”</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4 text-sm">
              <div><p className="text-xs uppercase text-muted-foreground">Customer</p><Link href={`/contacts/${inv.contact_id}`} className="text-primary hover:underline">{inv.contact?.name}</Link>{inv.contact?.tin && <p className="font-mono text-xs text-muted-foreground">TIN {inv.contact.tin}</p>}</div>
              <div><p className="text-xs uppercase text-muted-foreground">Due</p><p className={overdue ? "font-medium text-destructive" : undefined}>{formatDate(inv.due_date)}</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">Reference</p><p>{inv.reference ?? "—"}</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">Ledger entry</p>{inv.journal_entry ? <Link href={`/journal/${inv.journal_entry.id}`} className="font-mono text-primary hover:underline">{inv.journal_entry.number}</Link> : <p>—</p>}</div>
            </CardContent>
          </Card>
          <Card>
            <Table>
              <THead><TR><TH>Description</TH><TH>Account</TH><TH>VAT</TH><TH className="text-right">Qty</TH><TH className="text-right">Unit price</TH><TH className="text-right">Amount</TH></TR></THead>
              <TBody>
                {inv.lines?.map((l) => (
                  <TR key={l.id}>
                    <TD>{l.description}</TD>
                    <TD className="text-muted-foreground"><span className="font-mono">{l.account?.code}</span> {l.account?.name}</TD>
                    <TD className="font-mono text-xs">{l.vat_code?.code ?? "—"}</TD>
                    <TD className="text-right tabular-nums">{l.quantity}</TD>
                    <MoneyCell>{formatCents(l.unit_price)}</MoneyCell>
                    <MoneyCell>{formatCents(l.amount)}</MoneyCell>
                  </TR>
                ))}
              </TBody>
              <TFoot>
                <TR><TD colSpan={5}>Net</TD><MoneyCell>{formatCents(inv.net_amount)}</MoneyCell></TR>
                <TR><TD colSpan={5}>VAT</TD><MoneyCell>{formatCents(inv.vat_amount)}</MoneyCell></TR>
                <TR><TD colSpan={5} className="font-semibold">Total</TD><MoneyCell className="font-semibold">{formatCents(inv.total_amount)}</MoneyCell></TR>
                {inv.amount_paid > 0 && <TR><TD colSpan={5}>Paid</TD><MoneyCell>{formatCents(inv.amount_paid)}</MoneyCell></TR>}
                {inv.balance_due > 0 && <TR><TD colSpan={5} className="font-semibold">Balance due</TD><MoneyCell className="font-semibold">{formatCents(inv.balance_due)}</MoneyCell></TR>}
              </TFoot>
            </Table>
          </Card>
          {inv.notes && <Card><CardContent className="whitespace-pre-line p-5 text-sm">{inv.notes}</CardContent></Card>}
        </div>
        <div className="space-y-6">
          {can.manageBooks(me.role) && inv.status === "draft" && <DraftInvoiceActions invoice={inv} />}
          {can.manageBooks(me.role) && inv.status === "issued" && inv.amount_paid === 0 && <VoidInvoiceAction invoice={inv} />}
          <p className="text-xs text-muted-foreground">
            Created by {inv.creator?.name}{inv.issuer && <> · issued by {inv.issuer.name} on {formatDateTime(inv.issued_at)}</>}
          </p>
        </div>
      </div>
    </>
  );
}
