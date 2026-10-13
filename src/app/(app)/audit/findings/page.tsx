import type { Metadata } from "next";
import Link from "next/link";
import { getFindings, getMe } from "@/lib/api/endpoints";
import { formatDate, formatDateTime } from "@/lib/dates";
import { can } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FindingStatusBadge, SeverityBadge } from "@/components/features/badges";
import { FilterBar, FilterField } from "@/components/features/filter-bar";
import { Pagination } from "@/components/features/pagination";
import { RaiseFindingForm, ResolveFindingForm } from "@/components/features/audit/finding-forms";

export const metadata: Metadata = { title: "Audit findings" };

type Search = { status?: string; severity?: string; entry?: string; page?: string };

export default async function FindingsPage({ searchParams }: { searchParams: Search }) {
  const [me, findings] = await Promise.all([getMe(), getFindings({ status: searchParams.status, severity: searchParams.severity, page: searchParams.page })]);

  return (
    <>
      <PageHeader title="Audit findings" description="Issues raised by auditors. The accounting team responds and resolves them; everything is kept on the audit trail." />

      {can.manageFindings(me.role) && (
        <Card id="raise" className="mb-6 scroll-mt-6">
          <CardHeader><CardTitle>Raise a finding</CardTitle></CardHeader>
          <CardContent><RaiseFindingForm entryId={searchParams.entry} /></CardContent>
        </Card>
      )}

      <FilterBar>
        <FilterField label="Status">
          <Select name="status" defaultValue={searchParams.status ?? ""} className="w-32">
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </Select>
        </FilterField>
        <FilterField label="Severity">
          <Select name="severity" defaultValue={searchParams.severity ?? ""} className="w-32">
            <option value="">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </FilterField>
      </FilterBar>

      <Card>
        <div className="divide-y">
          {findings.data.map((f) => (
            <div key={f.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={f.severity} />
                    <FindingStatusBadge status={f.status} />
                    <h3 className="font-medium">{f.title}</h3>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm">{f.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Raised by {f.raiser?.name} on {formatDate(f.created_at)}
                    {f.entry && (
                      <> · Entry <Link className="font-mono text-primary hover:underline" href={`/journal/${f.entry.id}`}>{f.entry.number}</Link></>
                    )}
                  </p>
                  {f.status === "resolved" && (
                    <div className="mt-3 rounded-md border border-success/30 bg-success/5 p-3 text-sm">
                      <p className="whitespace-pre-line">{f.resolution}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Resolved by {f.resolver?.name} · {formatDateTime(f.resolved_at)}</p>
                    </div>
                  )}
                </div>
                {f.status === "open" && can.resolveFindings(me.role) && <div className="w-full sm:w-auto sm:min-w-[260px]"><ResolveFindingForm id={f.id} /></div>}
              </div>
            </div>
          ))}
        </div>
        {findings.data.length === 0 && <EmptyState title="No findings" hint="Nothing matches these filters." />}
        <Pagination meta={findings.meta} basePath="/audit/findings" params={searchParams} />
      </Card>
    </>
  );
}
