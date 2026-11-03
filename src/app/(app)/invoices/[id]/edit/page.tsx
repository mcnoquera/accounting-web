import { redirect } from "next/navigation";
import { getInvoice } from "@/lib/api/endpoints";
import { invoiceFormData } from "@/lib/invoice-form-data";
import { PageHeader } from "@/components/ui/page-header";
import { InvoiceForm } from "@/components/features/invoices/invoice-form";

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const [invoice, data] = await Promise.all([getInvoice(params.id), invoiceFormData()]);
  if (invoice.status !== "draft") redirect(`/invoices/${invoice.id}`);
  return (
    <>
      <PageHeader title="Edit draft invoice" description="Only drafts can be edited." />
      <InvoiceForm invoice={invoice} {...data} />
    </>
  );
}
