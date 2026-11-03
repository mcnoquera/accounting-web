import { redirect } from "next/navigation";
import { getAccounts, getEntry, getTaxCodes } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/ui/page-header";
import { EntryForm } from "@/components/features/journal/entry-form";

export default async function EditEntryPage({ params }: { params: { id: string } }) {
  const [entry, accounts, taxCodes] = await Promise.all([getEntry(params.id), getAccounts(), getTaxCodes()]);
  if (entry.status !== "draft") redirect(`/journal/${entry.id}`);
  return (
    <>
      <PageHeader title={`Edit ${entry.number}`} description="Only drafts can be edited." />
      <EntryForm accounts={accounts} entry={entry} taxCodes={taxCodes} />
    </>
  );
}
