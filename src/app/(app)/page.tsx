import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getDashboard, getMe } from "@/lib/api/endpoints";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyCell, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/features/badges";
import { cn } from "@/lib/utils";

function Stat({ label, value, hint, negative }: { label: string; value: string; hint?: string; negative?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn("mt-2 font-mono text-2xl font-semibold tabular-nums", negative && "text-destructive")}>{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const [d, me] = await Promise.all([getDashboard(), getMe()]);

  return (
    <>
      <PageHeader title={`Welcome back, ${me.name.split(" ")[0]}`} description="Snapshot of the books as of today." />

      <div className="mb-6 flex flex-wrap gap-3">
        <Link href="/reports/trial-balance" className={cn("inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm", d.books_balanced ? "border-success/30 bg-success/5 text-success" : "border-destructive/30 bg-destructive/5 text-destructive")}>
          {d.books_balanced ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {d.books_balanced ? "Books are in balance" : "Books are out of balance"}
        </Link>
        {d.draft_entries > 0 && (
          <Link href="/journal?status=draft" className="inline-flex items-center gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-1.5 text-sm text-warning">
            {d.draft_entries} draft {d.draft_entries === 1 ? "entry" : "entries"} awaiting posting
          </Link>
        )}
        {d.open_findings > 0 && (
          <Link href="/audit/findings?status=open" className="inline-flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-sm text-destructive">
            {d.open_findings} open audit {d.open_findings === 1 ? "finding" : "findings"}
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Total assets" value={formatCents(d.total_assets)} />
        <Stat label="Total liabilities" value={formatCents(d.total_liabilities)} />
        <Stat label="Total equity" value={formatCents(d.total_equity)} hint="Includes current-year earnings" />
        <Stat label="Revenue (YTD)" value={formatCents(d.ytd_revenue)} />
        <Stat label="Expenses (YTD)" value={formatCents(d.ytd_expenses)} />
        <Stat label="Net income (YTD)" value={formatCents(d.ytd_net_income)} negative={d.ytd_net_income < 0} />
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent journal entries</CardTitle>
          <Link href="/journal" className="text-sm text-primary hover:underline">View all</Link>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Number</TH>
              <TH>Date</TH>
              <TH>Description</TH>
              <TH>Status</TH>
              <TH className="text-right">Amount</TH>
            </TR>
          </THead>
          <TBody>
            {d.recent_entries.map((e) => (
              <TR key={e.id}>
                <TD><Link className="font-mono text-primary hover:underline" href={`/journal/${e.id}`}>{e.number}</Link></TD>
                <TD className="whitespace-nowrap">{formatDate(e.entry_date)}</TD>
                <TD>{e.description}</TD>
                <TD><StatusBadge status={e.status} /></TD>
                <MoneyCell>{formatCents(e.amount)}</MoneyCell>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
  );
}
