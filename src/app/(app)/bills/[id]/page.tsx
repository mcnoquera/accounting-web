import Link from "next/link";
import { getBill, getMe } from "@/lib/api/endpoints";
import { BILL_STATUS_LABEL } from "@/lib/bills";
import { INVOICE_STATUS_TONE, isOverdue } from "@/lib/invoices";
import { formatCents } from "@/lib/money";
import { formatDate, formatDateTime, today } from "@/lib/dates";
import { can } from "@/lib/permissions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyCell, TBody, TD, TFoot, TH, THead, TR, Table } from "@/components/ui/table";
import { DraftBillActions, VoidBillAction } from "@/components/features/bills/bill-actions";

export default async function BillPage({ params, searchParams }: { params: { id: string }; searchParams: { done?: string; record_error?: string } }) {
  const [bill, me] = await Promise.all([getBill(params.id), getMe()]);
  const overdue = isOverdue(bill, today());
  return (
    <>
      <PageHeader
        title={bill.number ? `Bill ${bill.number}` : "Draft bill"}
        description={`${bill.contact?.name} · supplier invoice ${bill.supplier_invoice_number} · ${formatDate(bill.bill_date)}`}
        actions={<div className="flex gap-2"><Badge tone={INVOICE_STATUS_TONE[bill.status]}>{BILL_STATUS_LABEL[bill.status]}</Badge>{overdue && <Badge tone="danger">overdue</Badge>}</div>}
      />
      {searchParams.done === "recorded" && bill.number && <Alert tone="success" className="mb-4">Bill {bill.number} recorded and posted to the ledger.</Alert>}
      {searchParams.done === "voided" && <Alert tone="success" className="mb-4">Bill voided; its ledger entry was reversed.</Alert>}
      {searchParams.record_error && <Alert className="mb-4">Saved as a draft, but it couldn&apos;t be recorded: {searchParams.record_error}</Alert>}
      {bill.status === "voided" && <Alert className="mb-4">Voided by {bill.voider?.name} on {formatDateTime(bill.voided_at)}: “{bill.void_reason}”</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-5 text-sm sm:grid-cols-4">
              <div><p className="text-xs uppercase text-muted-foreground">Supplier</p><Link href={`/contacts/${bill.contact_id}?type=payable`} className="text-primary hover:underline">{bill.contact?.name}</Link>{bill.contact?.tin && <p className="font-mono text-xs text-muted-foreground">TIN {bill.contact.tin}</p>}</div>
              <div><p className="text-xs uppercase text-muted-foreground">Due</p><p className={overdue ? "font-medium text-destructive" : undefined}>{formatDate(bill.due_date)}</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">Supplier invoice</p><p className="font-mono">{bill.supplier_invoice_number}</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">Ledger entry</p>{bill.journal_entry ? <Link href={`/journal/${bill.journal_entry.id}`} className="font-mono text-primary hover:underline">{bill.journal_entry.number}</Link> : <p>—</p>}</div>
            </CardContent>
          </Card>
          <Card>
            <Table>
              <THead><TR><TH>Description</TH><TH>Account</TH><TH>VAT</TH><TH>Withholding</TH><TH className="text-right">Amount</TH></TR></THead>
              <TBody>
                {bill.lines?.map((l) => (
                  <TR key={l.id}>
                    <TD>{l.description}</TD>
                    <TD className="text-muted-foreground"><span className="font-mono">{l.account?.code}</span> {l.account?.name}</TD>
                    <TD className="font-mono text-xs">{l.vat_code?.code ?? "—"}</TD>
                    <TD className="font-mono text-xs">{l.ewt_code ? `${l.ewt_code.code} ${l.ewt_code.rate}%` : "—"}</TD>
                    <MoneyCell>{formatCents(l.amount)}</MoneyCell>
                  </TR>
                ))}
              </TBody>
              <TFoot>
                <TR><TD colSpan={4}>Net</TD><MoneyCell>{formatCents(bill.net_amount)}</MoneyCell></TR>
                <TR><TD colSpan={4}>VAT</TD><MoneyCell>{formatCents(bill.vat_amount)}</MoneyCell></TR>
                <TR><TD colSpan={4}>Bill total</TD><MoneyCell>{formatCents(bill.total_amount)}</MoneyCell></TR>
                <TR><TD colSpan={4}>Less withholding tax</TD><MoneyCell>{formatCents(bill.ewt_amount)}</MoneyCell></TR>
                <TR><TD colSpan={4} className="font-semibold">Amount due to supplier</TD><MoneyCell className="font-semibold">{formatCents(bill.amount_due)}</MoneyCell></TR>
                {bill.amount_paid > 0 && <TR><TD colSpan={4}>Paid</TD><MoneyCell>{formatCents(bill.amount_paid)}</MoneyCell></TR>}
              </TFoot>
            </Table>
          </Card>
          {bill.notes && <Card><CardContent className="whitespace-pre-line p-5 text-sm">{bill.notes}</CardContent></Card>}
        </div>
        <div className="space-y-6">
          {can.manageBooks(me.role) && (bill.status === "issued" || bill.status === "partially_paid") && (
            <Link href={`/payments/new?type=payment&contact=${bill.contact_id}&document=${bill.id}`} className={buttonClass("default", "default", "w-full")}>Record payment</Link>
          )}
          {(bill.payments ?? []).length > 0 && (
            <Card>
              <CardContent className="space-y-1 p-4 text-sm">
                <p className="text-xs uppercase text-muted-foreground">Payments</p>
                {bill.payments!.map((p) => (
                  <div key={p.id} className="flex justify-between gap-2">
                    <Link href={`/payments/${p.id}`} className={`font-mono text-primary hover:underline ${p.status === "voided" ? "line-through opacity-60" : ""}`}>{p.number}</Link>
                    <span className="text-muted-foreground">{formatDate(p.payment_date)}</span>
                    <span className="font-mono">{formatCents(p.amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {can.manageBooks(me.role) && bill.status === "draft" && <DraftBillActions bill={bill} />}
          {can.manageBooks(me.role) && bill.status === "issued" && bill.amount_paid === 0 && <VoidBillAction bill={bill} />}
          <p className="text-xs text-muted-foreground">Entered by {bill.creator?.name}{bill.issuer && <> · recorded by {bill.issuer.name} on {formatDateTime(bill.issued_at)}</>}</p>
        </div>
      </div>
    </>
  );
}
