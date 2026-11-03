import type { Metadata } from "next";
import { invoiceFormData } from "@/lib/invoice-form-data";
import { PageHeader } from "@/components/ui/page-header";
import { InvoiceForm } from "@/components/features/invoices/invoice-form";

export const metadata: Metadata = { title: "New invoice" };

export default async function NewInvoicePage() {
  const data = await invoiceFormData();
  return (
    <>
      <PageHeader title="New sales invoice" description="Save as a draft to review it, or issue it straight away." />
      <InvoiceForm {...data} />
    </>
  );
}
