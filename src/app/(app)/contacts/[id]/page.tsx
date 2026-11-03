import Link from "next/link";
import { getContact, getContactLedger, getMe } from "@/lib/api/endpoints";
import { CONTACT_TYPE_LABEL } from "@/lib/contacts";
import { formatCents } from "@/lib/money";
import { formatDate, startOfYear, today } from "@/lib/dates";
import { can } from "@/lib/permissions";
import type { ControlType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyCell, TBody, TD, TFoot, TH, THead, TR, Table } from "@/components/ui/table";
import { FilterBar, FilterField } from "@/components/features/filter-bar";
import { ContactForm, DeleteContact } from "@/components/features/contacts/contact-form";

export default async function ContactPage({ params, searchParams }: { params: { id: string }; searchParams: { from?: string; to?: string; type?: ControlType } }) {
  const contact = await getContact(params.id);
  const from = searchParams.from ?? startOfYear();
  const to = searchParams.to ?? today();
  const type: ControlType = searchParams.type ?? (contact.type === "supplier" ? "payable" : "receivable");
  const [me, ledger] = await Promise.all([getMe(), getContactLedger(params.id, { from, to, type })]);
  const label = type === "receivable" ? "Receivable" : "Payable";

  return (
    <>
      <PageHeader
        title={contact.name}
        description={[CONTACT_TYPE_LABEL[contact.type], contact.tin && `TIN ${contact.tin}`, `${contact.payment_terms_days}-day terms`].filter(Boolean).join(" · ")}
        actions={<Badge tone={contact.is_active ? "success" : "neutral"}>{contact.is_active ? "active" : "inactive"}</Badge>}
      />

      <FilterBar>
        {contact.type === "both" && (
          <FilterField label="Ledger">
            <Select name="type" defaultValue={type} className="w-36">
              <option value="receivable">Receivable</option>
              <option value="payable">Payable</option>
            </Select>
          </FilterField>
        )}
        <FilterField label="From"><Input type="date" name="from" defaultValue={from} /></FilterField>
        <FilterField label="To"><Input type="date" name="to" defaultValue={to} /></FilterField>
      </FilterBar>

      <Card className="mb-6">
        <CardHeader><CardTitle>{label} ledger</CardTitle></CardHeader>
        <Table>
          <THead>
            <TR><TH>Date</TH><TH>Entry</TH><TH>Description</TH><TH className="text-right">Debit</TH><TH className="text-right">Credit</TH><TH className="text-right">Balance</TH></TR>
          </THead>
          <TBody>
            <TR><TD colSpan={5} className="text-muted-foreground">Opening balance</TD><MoneyCell>{formatCents(ledger.opening_balance)}</MoneyCell></TR>
            {ledger.rows.map((r) => (
              <TR key={`${r.entry_id}-${r.balance}`}>
                <TD>{formatDate(r.entry_date)}</TD>
                <TD><Link href={`/journal/${r.entry_id}`} className="font-mono text-primary hover:underline">{r.number}</Link></TD>
                <TD className="text-muted-foreground">{r.description}{r.memo && <span className="block text-xs">{r.memo}</span>}</TD>
                <MoneyCell>{r.debit ? formatCents(r.debit) : ""}</MoneyCell>
                <MoneyCell>{r.credit ? formatCents(r.credit) : ""}</MoneyCell>
                <MoneyCell>{formatCents(r.balance)}</MoneyCell>
              </TR>
            ))}
          </TBody>
          <TFoot>
            <TR><TD colSpan={5}>Closing balance ({type === "receivable" ? "owed to us" : "we owe"})</TD><MoneyCell>{formatCents(ledger.closing_balance)}</MoneyCell></TR>
          </TFoot>
        </Table>
      </Card>

      {can.manageContacts(me.role) && (
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <div className="space-y-4 px-5 pb-5">
            <ContactForm contact={contact} />
            <DeleteContact contact={contact} />
          </div>
        </Card>
      )}
    </>
  );
}
