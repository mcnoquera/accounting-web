import type { Metadata } from "next";
import { getCompany, getMe } from "@/lib/api/endpoints";
import { can } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CompanyForm } from "@/components/features/settings/company-form";

export const metadata: Metadata = { title: "Company profile" };

export default async function CompanyPage() {
  const [company, me] = await Promise.all([getCompany(), getMe()]);
  const editable = can.manageCompany(me.role);

  return (
    <>
      <PageHeader
        title={company ? "Company profile" : "Set up your company"}
        description={
          company
            ? "Shown on the app header and, later, on reports and BIR books."
            : "First-run setup: enter the details from your BIR Certificate of Registration (Form 2303)."
        }
      />
      <Card>
        <CardContent className="p-5">
          {!company && !editable ? (
            <p className="text-sm text-muted-foreground">Your administrator hasn’t set up the company profile yet.</p>
          ) : (
            <CompanyForm company={company} readOnly={!editable} />
          )}
        </CardContent>
      </Card>
    </>
  );
}
