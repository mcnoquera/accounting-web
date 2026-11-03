import type { Metadata } from "next";
import Link from "next/link";
import { getAccounts, getFiscalYears, getMe, getPeriods } from "@/lib/api/endpoints";
import { groupIds } from "@/lib/accounts";
import { formatCents } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/dates";
import { can } from "@/lib/permissions";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { periodLabel } from "@/lib/periods";
import { CloseFiscalYearForm, ClosePeriodButton, PeriodStatusBadge, ReopenPeriodForm } from "@/components/features/settings/period-controls";

export const metadata: Metadata = { title: "Accounting periods" };

export default async function PeriodsPage() {
  const [me, overview, years, accounts] = await Promise.all([getMe(), getPeriods(), getFiscalYears(), getAccounts({ type: "equity", active: "1" })]);
  const groups = groupIds(accounts);
  const equityAccounts = accounts.filter((a) => !groups.has(a.id));
  const yearEnds = new Set(years.filter((y) => y.status === "closed").map((y) => y.end_date.slice(0, 7)));

  return (
    <>
      <PageHeader
        title="Accounting periods"
        description="Close each month once its books are final. Entries dated in a closed month can't be created, posted or voided; correct them with a reversal dated in an open month."
      />

      <Alert tone="info" className="mb-4">
        {overview.locked_through
          ? <>Books are closed through <strong>{formatDate(overview.locked_through)}</strong>. New entries must be dated {formatDate(overview.first_open_date)} or later.</>
          : <>No periods are closed yet.</>}
        {overview.next_to_close && <> Next to close: <strong>{periodLabel(overview.next_to_close)}</strong>.</>}
        {" "}Periods close in order; only the most recent can be reopened, by an admin or accountant, with a reason.
      </Alert>

      <Card className="mb-6">
        <CardHeader><CardTitle>Fiscal years</CardTitle></CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Fiscal year</TH>
              <TH className="w-24">Status</TH>
              <TH className="text-right">Net income</TH>
              <TH>Closing entry</TH>
              <TH className="text-right">Action</TH>
            </TR>
          </THead>
          <TBody>
            {years.map((y) => (
              <TR key={y.fiscal_year}>
                <TD className="font-medium">
                  FY {y.fiscal_year}
                  <div className="text-xs text-muted-foreground">{formatDate(y.start_date)} – {formatDate(y.end_date)}</div>
                </TD>
                <TD><Badge tone={y.status === "closed" ? "neutral" : "success"}>{y.status}</Badge></TD>
                <TD className={`text-right font-mono tabular-nums ${y.net_income < 0 ? "text-destructive" : ""}`}>{formatCents(y.net_income)}</TD>
                <TD className="text-xs text-muted-foreground">
                  {y.closing_entry && <Link className="font-mono text-primary hover:underline" href={`/journal/${y.closing_entry.id}`}>{y.closing_entry.number}</Link>}
                  {y.retained_earnings_account && y.status === "closed" && <> to {y.retained_earnings_account.code} {y.retained_earnings_account.name}</>}
                  {y.closed_by && <div>Closed by {y.closed_by.name}, {formatDateTime(y.closed_at)}</div>}
                  {y.status === "open" && !y.periods_closed && <span>Close every month first.</span>}
                </TD>
                <TD className="text-right">
                  {y.can_close && can.closePeriods(me.role) && <CloseFiscalYearForm year={y.fiscal_year} equityAccounts={equityAccounts} />}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Period</TH>
              <TH className="w-24">Status</TH>
              <TH className="text-right">Posted</TH>
              <TH className="text-right">Drafts</TH>
              <TH>History</TH>
              <TH className="text-right">Action</TH>
            </TR>
          </THead>
          <TBody>
            {overview.periods.map((p) => (
              <TR key={p.period}>
                <TD className="font-medium">
                  {periodLabel(p.period)}
                  <div className="text-xs text-muted-foreground">{formatDate(p.start_date)} – {formatDate(p.end_date)}</div>
                </TD>
                <TD><PeriodStatusBadge status={p.status} /></TD>
                <TD className="text-right tabular-nums">{p.posted_count}</TD>
                <TD className="text-right tabular-nums">
                  {p.draft_count > 0
                    ? <Link className="text-warning hover:underline" href={`/journal?status=draft&from=${p.start_date}&to=${p.end_date}`}>{p.draft_count}</Link>
                    : 0}
                </TD>
                <TD className="text-xs text-muted-foreground">
                  {p.status === "closed" && p.closed_by && <div>Closed by {p.closed_by.name}, {formatDateTime(p.closed_at)}</div>}
                  {p.reopened_by && <div>Reopened by {p.reopened_by.name}, {formatDateTime(p.reopened_at)}: “{p.reopen_reason}”</div>}
                </TD>
                <TD className="text-right">
                  {p.can_close && can.closePeriods(me.role) && <ClosePeriodButton period={p} />}
                  {p.can_reopen && can.reopenPeriods(me.role) && <ReopenPeriodForm period={p} closesYear={yearEnds.has(p.period)} />}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
  );
}
