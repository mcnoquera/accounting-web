import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getEntries, getMe } from "@/lib/api/endpoints";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { can } from "@/lib/permissions";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyCell, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/features/badges";
import { FilterBar, FilterField } from "@/components/features/filter-bar";
import { Pagination } from "@/components/features/pagination";

export const metadata: Metadata = { title: "Journal entries" };

type Search = { status?: string; from?: string; to?: string; q?: string; page?: string };

export default async function JournalPage({ searchParams }: { searchParams: Search }) {
  const [page, me] = await Promise.all([getEntries(searchParams), getMe()]);

  return (
    <>
      <PageHeader
        title="Journal entries"
        description="Double-entry transactions. Drafts can be edited; posted entries are locked and can only be voided."
        actions={can.manageBooks(me.role) && (
          <Link href="/journal/new" className={buttonClass()}><Plus size={16} /> New entry</Link>
        )}
      />

      <FilterBar>
        <FilterField label="Search">
          <Input name="q" defaultValue={searchParams.q} placeholder="Number, description, ref" className="w-56" />
        </FilterField>
        <FilterField label="Status">
          <Select name="status" defaultValue={searchParams.status ?? ""} className="w-32">
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="posted">Posted</option>
            <option value="voided">Voided</option>
          </Select>
        </FilterField>
        <FilterField label="From"><Input type="date" name="from" defaultValue={searchParams.from} /></FilterField>
        <FilterField label="To"><Input type="date" name="to" defaultValue={searchParams.to} /></FilterField>
      </FilterBar>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Number</TH>
              <TH>Date</TH>
              <TH>Description</TH>
              <TH>Reference</TH>
              <TH>Prepared by</TH>
              <TH>Status</TH>
              <TH className="text-right">Amount</TH>
            </TR>
          </THead>
          <TBody>
            {page.data.map((e) => (
              <TR key={e.id}>
                <TD><Link className="font-mono text-primary hover:underline" href={`/journal/${e.id}`}>{e.number}</Link></TD>
                <TD className="whitespace-nowrap">{formatDate(e.entry_date)}</TD>
                <TD>{e.description}</TD>
                <TD className="font-mono text-xs text-muted-foreground">{e.reference}</TD>
                <TD className="text-muted-foreground">{e.creator?.name}</TD>
                <TD><StatusBadge status={e.status} /></TD>
                <MoneyCell>{formatCents(e.lines.reduce((s, l) => s + l.debit, 0))}</MoneyCell>
              </TR>
            ))}
          </TBody>
        </Table>
        {page.data.length === 0 && <EmptyState title="No entries match these filters" />}
        <Pagination meta={page.meta} basePath="/journal" params={searchParams} />
      </Card>
    </>
  );
}
