import Link from "next/link";
import { getMe, getPayment } from "@/lib/api/endpoints";
import { paymentFormData } from "@/lib/payment-form-data";
import { formatCents } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/dates";
import { can } from "@/lib/permissions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyCell, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { AllocateUnapplied, VoidPaymentAction } from "@/components/features/payments/payment-actions";

export default async function PaymentPage({ params, searchParams }: { params: { id: string }; searchParams: { done?: string } }) {
  const [p, me] = await Promise.all([getPayment(params.id), getMe()]);
  const receipt = p.direction === "receipt";
  const canEdit = can.manageBooks(me.role) && p.status === "posted";
  const openDocs = canEdit && p.unapplied_amount > 0 ? (await paymentFormData(p.direction)).openDocs[p.contact_id] ?? [] : [];
  const docHref = (id: number) => `/${receipt ? "invoices" : "bills"}/${id}`;

  return (
    <>
      <PageHeader
        title={`${receipt ? "Receipt" : "Payment"} ${p.number}`}
        description={`${p.contact?.name} · ${formatDate(p.payment_date)}`}
        actions={<Badge tone={p.status === "voided" ? "neutral" : "success"}>{p.status}</Badge>}
      />
      {searchParams.done === "recorded" && <Alert tone="success" className="mb-4">{receipt ? "Receipt" : "Payment"} recorded and posted.</Alert>}
      {searchParams.done === "allocated" && <Alert tone="success" className="mb-4">Allocated.</Alert>}
      {p.status === "voided" && <Alert className="mb-4">Voided by {p.voider?.name} on {formatDateTime(p.voided_at)}: “{p.void_reason}”. The {receipt ? "invoices" : "bills"} it paid were reopened.</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-5 text-sm sm:grid-cols-4">
              <div><p className="text-xs uppercase text-muted-foreground">{receipt ? "Received into" : "Paid from"}</p><p>{p.cash_account?.code} {p.cash_account?.name}</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">Amount</p><p className="font-mono">{formatCents(p.amount)}</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">Reference</p><p>{p.reference ?? "—"}</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">Ledger entry</p>{p.journal_entry ? <Link href={`/journal/${p.journal_entry.id}`} className="font-mono text-primary hover:underline">{p.journal_entry.number}</Link> : "—"}</div>
              {p.withholding_amount > 0 && (
                <div className="col-span-full"><p className="text-xs uppercase text-muted-foreground">Withheld by customer (Form 2307)</p>
                  <p><span className="font-mono">{p.ewt_code?.code}</span> {p.ewt_code?.rate}% of {formatCents(p.withholding_base)} = <span className="font-mono">{formatCents(p.withholding_amount)}</span></p></div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Applied to</CardTitle></CardHeader>
            <Table>
              <THead><TR><TH>{receipt ? "Invoice" : "Bill"}</TH><TH>Status now</TH><TH className="text-right">Applied</TH></TR></THead>
              <TBody>
                {(p.allocations ?? []).map((a) => (
                  <TR key={a.id}>
                    <TD><Link href={docHref(a.document_id)} className="font-mono text-primary hover:underline">{a.document?.number}</Link></TD>
                    <TD className="text-muted-foreground">{a.document?.status?.replace("_", " ")}</TD>
                    <MoneyCell>{formatCents(a.amount)}</MoneyCell>
                  </TR>
                ))}
                <TR><TD colSpan={2} className="text-muted-foreground">Unapplied</TD><MoneyCell className={p.unapplied_amount ? "text-warning" : undefined}>{formatCents(p.unapplied_amount)}</MoneyCell></TR>
              </TBody>
            </Table>
          </Card>
          {canEdit && p.unapplied_amount > 0 && <AllocateUnapplied payment={p} docs={openDocs} />}
        </div>
        <div className="space-y-6">
          {canEdit && <VoidPaymentAction payment={p} />}
          <p className="text-xs text-muted-foreground">Recorded by {p.creator?.name}</p>
        </div>
      </div>
    </>
  );
}
