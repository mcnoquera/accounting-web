import type { Metadata } from "next";
import { getMe } from "@/lib/api/endpoints";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { NoAccess } from "@/components/features/no-access";
import { ImportCard } from "@/components/features/imports/import-card";

export const metadata: Metadata = { title: "Import" };

export default async function ImportPage() {
  const me = await getMe();
  if (!can.manageBooks(me.role)) return <NoAccess what="imports" hint="Admins and accountants can import." />;
  return (
    <>
      <PageHeader title="Import" description="Bring your chart of accounts and contacts in from a spreadsheet. Preview first: nothing is written until you import, and a file with any problem imports nothing." />
      <div className="space-y-6">
        <ImportCard kind="accounts" title="Chart of accounts" hint="Matched on code: new codes are created, existing ones updated. Parent accounts can be anywhere in the file. An account with entries can't change type." />
        <ImportCard kind="contacts" title="Customers & suppliers" hint="Matched on TIN, or on the exact name when there's no TIN." />
      </div>
    </>
  );
}
