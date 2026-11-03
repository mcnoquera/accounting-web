import type { Metadata } from "next";
import { getAccounts, getTaxCodes } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/ui/page-header";
import { EntryForm } from "@/components/features/journal/entry-form";

export const metadata: Metadata = { title: "New journal entry" };

export default async function NewEntryPage() {
  const [accounts, taxCodes] = await Promise.all([getAccounts(), getTaxCodes()]);
  return (
    <>
      <PageHeader title="New journal entry" description="Entries are saved as drafts. Debits must equal credits before they can be saved." />
      <EntryForm accounts={accounts} taxCodes={taxCodes} />
    </>
  );
}
