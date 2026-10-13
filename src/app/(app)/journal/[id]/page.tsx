import Link from "next/link";
import { getEntry, getMe } from "@/lib/api/endpoints";
import { formatCents } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/dates";
import { can } from "@/lib/permissions";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyCell, TBody, TD, TFoot, TH, THead, TR, Table } from "@/components/ui/table";
import { FindingStatusBadge, SeverityBadge, StatusBadge } from "@/components/features/badges";
import { DraftActions, VoidAction } from "@/components/features/journal/entry-actions";

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}

export default async function EntryPage({ params, searchParams }: { params: { id: string }; searchParams: { post?: string; done?: string } }) {
  const [entry, me] = await Promise.all([getEntry(params.id), getMe()]);
  const debit = entry.lines.reduce((s, l) => s + l.debit, 0);
  const credit = entry.lines.reduce((s, l) => s + l.credit, 0);

  return (
    <>
      <PageHeader
        title={entry.number}
        description={entry.description}
        actions={<StatusBadge status={entry.status} />}
      />

      {searchParams.done === "posted" && entry.status === "posted" && (
        <Alert tone="success" className="mb-4">Entry posted to the ledger. It now appears in reports and can no longer be edited.</Alert>
      )}
      {entry.status === "voided" && (
        <Alert className="mb-4">Voided by {entry.voider?.name} on {formatDateTime(entry.voided_at)}: “{entry.void_reason}”</Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
              <Meta label="Entry date">{formatDate(entry.entry_date)}</Meta>
              <Meta label="Reference"><span className="font-mono">{entry.reference ?? "—"}</span></Meta>
              <Meta label="Prepared by">{entry.creator?.name}</Meta>
              <Meta label="Posted by">
                {entry.poster ? <>{entry.poster.name}<br /><span className="text-xs text-muted-foreground">{formatDateTime(entry.posted_at)}</span></> : "—"}
              </Meta>
            </CardContent>
          </Card>

          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>Account</TH>
                  <TH>Memo</TH>
                  <TH className="text-right">Debit</TH>
                  <TH className="text-right">Credit</TH>
                </TR>
              </THead>
              <TBody>
                {entry.lines.map((l) => (
                  <TR key={l.id}>
                    <TD>
                      <Link href={`/accounts/${l.account_id}`} className="hover:underline">
                        <span className="font-mono text-muted-foreground">{l.account.code}</span> {l.account.name}
                      </Link>
                    </TD>
                    <TD className="text-muted-foreground">{l.memo}</TD>
                    <MoneyCell>{l.debit ? formatCents(l.debit) : ""}</MoneyCell>
                    <MoneyCell>{l.credit ? formatCents(l.credit) : ""}</MoneyCell>
                  </TR>
                ))}
              </TBody>
              <TFoot>
                <TR>
                  <TD colSpan={2}>Total</TD>
                  <MoneyCell>{formatCents(debit)}</MoneyCell>
                  <MoneyCell>{formatCents(credit)}</MoneyCell>
                </TR>
              </TFoot>
            </Table>
          </Card>

          {entry.findings && entry.findings.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Audit findings on this entry</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {entry.findings.map((f) => (
                  <div key={f.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={f.severity} />
                      <FindingStatusBadge status={f.status} />
                      <span className="text-sm font-medium">{f.title}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
                  </div>
                ))}
                <Link className="text-sm text-primary hover:underline" href="/audit/findings">Go to findings</Link>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {can.manageBooks(me.role) && entry.status === "draft" && <DraftActions entry={entry} me={me} highlight={searchParams.post === "1"} />}
          {can.manageBooks(me.role) && entry.status === "posted" && <VoidAction entry={entry} />}
          {can.manageFindings(me.role) && (
            <Link href={`/audit/findings?entry=${entry.id}#raise`} className="block rounded-lg border bg-card p-4 text-sm hover:bg-muted">
              <span className="font-medium">Raise an audit finding</span>
              <p className="text-muted-foreground">Flag a problem with this entry for the accounting team.</p>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
