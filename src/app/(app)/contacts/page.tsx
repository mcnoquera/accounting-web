import type { Metadata } from "next";
import Link from "next/link";
import { getContacts, getMe } from "@/lib/api/endpoints";
import { CONTACT_TYPE_LABEL } from "@/lib/contacts";
import { can } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { FilterBar, FilterField } from "@/components/features/filter-bar";
import { ContactForm } from "@/components/features/contacts/contact-form";

export const metadata: Metadata = { title: "Customers & suppliers" };

export default async function ContactsPage({ searchParams }: { searchParams: { type?: string; q?: string } }) {
  const [me, contacts] = await Promise.all([getMe(), getContacts({ type: searchParams.type, q: searchParams.q })]);

  return (
    <>
      <PageHeader
        title="Customers & suppliers"
        description="Every line on a receivable or payable control account names one of these, so each has its own balance, ledger and aging."
      />
      {can.manageContacts(me.role) && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Add contact</CardTitle></CardHeader>
          <div className="px-5 pb-5"><ContactForm /></div>
        </Card>
      )}
      <FilterBar>
        <FilterField label="Search"><Input name="q" defaultValue={searchParams.q} placeholder="Name or TIN" className="w-56" /></FilterField>
        <FilterField label="Type">
          <Select name="type" defaultValue={searchParams.type ?? ""} className="w-36">
            <option value="">All</option>
            <option value="customer">Customers</option>
            <option value="supplier">Suppliers</option>
          </Select>
        </FilterField>
      </FilterBar>
      <Card>
        {contacts.length === 0 ? (
          <EmptyState title="No contacts yet" hint="Add your customers and suppliers before recording receivables and payables." />
        ) : (
          <Table>
            <THead>
              <TR><TH>Name</TH><TH>Type</TH><TH>TIN</TH><TH className="text-right">Terms</TH><TH>Status</TH></TR>
            </THead>
            <TBody>
              {contacts.map((c) => (
                <TR key={c.id}>
                  <TD><Link href={`/contacts/${c.id}`} className="font-medium text-primary hover:underline">{c.name}</Link></TD>
                  <TD className="text-muted-foreground">{CONTACT_TYPE_LABEL[c.type]}</TD>
                  <TD className="font-mono text-muted-foreground">{c.tin ?? "—"}</TD>
                  <TD className="text-right tabular-nums">{c.payment_terms_days} days</TD>
                  <TD><Badge tone={c.is_active ? "success" : "neutral"}>{c.is_active ? "active" : "inactive"}</Badge></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
