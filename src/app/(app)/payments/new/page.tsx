import type { Metadata } from "next";
import { paymentFormData } from "@/lib/payment-form-data";
import { PageHeader } from "@/components/ui/page-header";
import { PaymentForm } from "@/components/features/payments/payment-form";

export const metadata: Metadata = { title: "Record payment" };

export default async function NewPaymentPage({ searchParams }: { searchParams: { type?: string; contact?: string; document?: string } }) {
  const direction = searchParams.type === "payment" ? "payment" : "receipt";
  const data = await paymentFormData(direction);
  return (
    <>
      <PageHeader
        title={direction === "receipt" ? "Record a receipt" : "Pay a supplier"}
        description={direction === "receipt"
          ? "Money received from a customer, applied to their invoices. Include any tax they withheld (Form 2307)."
          : "Money paid to a supplier, applied to their bills. Withholding was already deducted when each bill was recorded."}
      />
      <PaymentForm direction={direction} {...data} initialContactId={searchParams.contact ?? ""} initialDocumentId={searchParams.document ? Number(searchParams.document) : undefined} />
    </>
  );
}
