import type { Metadata } from "next";
import Link from "next/link";
import { getAuditExceptions, getMe } from "@/lib/api/endpoints";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { can } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyCell, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SeverityBadge } from "@/components/features/badges";
import { FilterBar, FilterField } from "@/components/features/filter-bar";
import { NoAccess } from "@/components/features/no-access";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit exceptions" };

export default async function ExceptionsPage({ searchParams }: { searchParams: { from?: string; to?: string; rule?: string } }) {
  const me = await getMe();
  if (!can.viewAudit(me.role)) return <NoAccess what="audit exceptions" />;

  const report = await getAuditExceptions({ from: searchParams.from, to: searchParams.to });
  const flags = searchParams.rule ? report.flags.filter((f) => f.rule === searchParams.rule) : report.flags;
  const ruleHref = (rule?: string) => {
    const q = new URLSearchParams(Object.entries({ from: searchParams.from, to: searchParams.to, rule }).filter(([, v]) => v) as [string, string][]);
    return `/audit/exceptions?${q}`;
  };

  return (
    <>
      <PageHeader
        title="Audit exceptions"
        description="Automated tests over every posted entry. Each flag is a lead for review, not proof of an error."
      />
      <FilterBar>
        <FilterField label="Entry date from"><Input type="date" name="from" defaultValue={searchParams.from} /></FilterField>
        <FilterField label="To"><Input type="date" name="to" defaultValue={searchParams.to} /></FilterField>
        {searchParams.rule && <input type="hidden" name="rule" value={searchParams.rule} />}
      </FilterBar>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {report.rules.map((r) => (
          <Link key={r.key} href={searchParams.rule === r.key ? ruleHref() : ruleHref(r.key)}>
            <Card className={cn("h-full transition-colors hover:bg-muted/50", searchParams.rule === r.key && "ring-2 ring-primary")}>
              <CardContent className="flex items-center justify-between p-4">
                <span className="text-sm">{r.title}</span>
                <span className={cn("font-mono text-lg font-semibold", r.count === 0 ? "text-muted-foreground" : "text-foreground")}>{r.count}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Severity</TH>
              <TH>Test</TH>
              <TH>Entry</TH>
              <TH>Date</TH>
              <TH>Detail</TH>
              <TH className="text-right">Amount</TH>
            </TR>
          </THead>
          <TBody>
            {flags.map((f, i) => (
              <TR key={`${f.rule}-${f.entry.id}-${i}`}>
                <TD><SeverityBadge severity={f.severity} /></TD>
                <TD className="whitespace-nowrap text-sm">{f.title}</TD>
                <TD>
                  <Link className="font-mono text-primary hover:underline" href={`/journal/${f.entry.id}`}>{f.entry.number}</Link>
                  <p className="text-xs text-muted-foreground">{f.entry.description}</p>
                </TD>
                <TD className="whitespace-nowrap">{formatDate(f.entry.entry_date)}</TD>
                <TD className="text-sm text-muted-foreground">{f.message}</TD>
                <MoneyCell>{formatCents(f.entry.amount)}</MoneyCell>
              </TR>
            ))}
          </TBody>
        </Table>
        {flags.length === 0 && <EmptyState title="No exceptions" hint="Every posted entry passed these tests." />}
      </Card>
    </>
  );
}
