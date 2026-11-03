import type { Metadata } from "next";
import { getAccounts, getPeriods } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/ui/page-header";
import { EntryForm } from "@/components/features/journal/entry-form";

export const metadata: Metadata = { title: "New journal entry" };

export default async function NewEntryPage() {
  const [accounts, periods] = await Promise.all([getAccounts(), getPeriods()]);
  return (
    <>
      <PageHeader title="New journal entry" description="Entries are saved as drafts. Debits must equal credits before they can be saved." />
      <EntryForm accounts={accounts} firstOpenDate={periods.first_open_date} />
    </>
  );
}
