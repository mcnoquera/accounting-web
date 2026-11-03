import type { Metadata } from "next";
import { getMe, getTaxCodes } from "@/lib/api/endpoints";
import { can } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { CreateTaxCodeForm, EditTaxCodeForm } from "@/components/features/settings/tax-code-forms";

export const metadata: Metadata = { title: "Tax codes" };

const CATEGORY: Record<string, string> = { vatable: "Vatable", zero_rated: "Zero-rated", exempt: "Exempt" };

export default async function TaxCodesPage() {
  const [me, codes] = await Promise.all([getMe(), getTaxCodes()]);
  const admin = can.manageTaxCodes(me.role);

  return (
    <>
      <PageHeader
        title="Tax codes"
        description="Put a VAT code and/or a withholding code (BIR ATC) on the sale or purchase line of an entry. Posting checks that the VAT and withholding lines match base × rate."
      />

      {admin && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Add tax code</CardTitle></CardHeader>
          <div className="px-5 pb-5"><CreateTaxCodeForm /></div>
        </Card>
      )}

      <Card>
        <Table>
          <THead>
            <TR>
              <TH className="w-28">Code</TH>
              <TH>Name</TH>
              <TH className="w-28">Kind</TH>
              <TH className="w-20 text-right">Rate</TH>
              <TH className="w-20 text-right">Used</TH>
              <TH className="w-24">Status</TH>
              {admin && <TH className="text-right">Edit</TH>}
            </TR>
          </THead>
          <TBody>
            {codes.map((c) => (
              <TR key={c.id}>
                <TD className="font-mono font-medium">{c.code}</TD>
                <TD>{c.name}</TD>
                <TD className="text-muted-foreground">{c.kind === "vat" ? `VAT · ${CATEGORY[c.vat_category ?? ""] ?? ""}` : "Withholding"}</TD>
                <TD className="text-right font-mono tabular-nums">{c.rate}%</TD>
                <TD className="text-right tabular-nums">{c.lines_count ?? 0}</TD>
                <TD><Badge tone={c.is_active ? "success" : "neutral"}>{c.is_active ? "active" : "inactive"}</Badge></TD>
                {admin && <TD className="text-right"><EditTaxCodeForm code={c} /></TD>}
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
  );
}
