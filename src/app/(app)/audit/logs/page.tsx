import type { Metadata } from "next";
import Link from "next/link";
import { getAuditLogs, getMe } from "@/lib/api/endpoints";
import { formatDateTime } from "@/lib/dates";
import { can } from "@/lib/permissions";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar, FilterField } from "@/components/features/filter-bar";
import { Pagination } from "@/components/features/pagination";
import { NoAccess } from "@/components/features/no-access";
import { ChangeDiff } from "@/components/features/audit/change-diff";

export const metadata: Metadata = { title: "Audit trail" };

const actionTone: Record<string, BadgeTone> = { created: "success", updated: "info", deleted: "danger", login_failed: "danger", login: "neutral", logout: "neutral" };
const typeLink: Record<string, string> = { JournalEntry: "/journal", Account: "/accounts" };

type Search = { action?: string; type?: string; from?: string; to?: string; page?: string };

export default async function AuditLogPage({ searchParams }: { searchParams: Search }) {
  const me = await getMe();
  if (!can.viewAudit(me.role)) return <NoAccess what="the audit trail" />;
  const logs = await getAuditLogs(searchParams);

  return (
    <>
      <PageHeader title="Audit trail" description="Append-only record of every change, sign-in and failed sign-in. Rows can’t be edited or deleted." />
      <FilterBar>
        <FilterField label="Action">
          <Select name="action" defaultValue={searchParams.action ?? ""} className="w-36">
            <option value="">All</option>
            {["created", "updated", "deleted", "login", "login_failed", "logout"].map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Record type">
          <Select name="type" defaultValue={searchParams.type ?? ""} className="w-40">
            <option value="">All</option>
            {["JournalEntry", "Account", "AuditFinding", "User"].map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        </FilterField>
        <FilterField label="From"><Input type="date" name="from" defaultValue={searchParams.from} /></FilterField>
        <FilterField label="To"><Input type="date" name="to" defaultValue={searchParams.to} /></FilterField>
      </FilterBar>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>When</TH>
              <TH>User</TH>
              <TH>Action</TH>
              <TH>Record</TH>
              <TH>Changes</TH>
              <TH>IP</TH>
            </TR>
          </THead>
          <TBody>
            {logs.data.map((l) => (
              <TR key={l.id} className="align-top">
                <TD className="whitespace-nowrap text-xs">{formatDateTime(l.created_at)}</TD>
                <TD className="whitespace-nowrap">{l.user ? <>{l.user.name}<p className="text-xs capitalize text-muted-foreground">{l.user.role}</p></> : <span className="text-muted-foreground">—</span>}</TD>
                <TD><Badge tone={actionTone[l.action] ?? "neutral"}>{l.action.replace("_", " ")}</Badge></TD>
                <TD className="whitespace-nowrap font-mono text-xs">
                  {l.auditable_type && (typeLink[l.auditable_type] && l.action !== "deleted"
                    ? <Link className="text-primary hover:underline" href={`${typeLink[l.auditable_type]}/${l.auditable_id}`}>{l.auditable_type} #{l.auditable_id}</Link>
                    : `${l.auditable_type} #${l.auditable_id}`)}
                </TD>
                <TD className="max-w-md"><ChangeDiff oldValues={l.old_values} newValues={l.new_values} /></TD>
                <TD className="font-mono text-xs text-muted-foreground">{l.ip_address}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {logs.data.length === 0 && <EmptyState title="No activity matches these filters" />}
        <Pagination meta={logs.meta} basePath="/audit/logs" params={searchParams} />
      </Card>
    </>
  );
}
