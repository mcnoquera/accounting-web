import type { Metadata } from "next";
import { billFormData } from "@/lib/bill-form-data";
import { PageHeader } from "@/components/ui/page-header";
import { BillForm } from "@/components/features/bills/bill-form";

export const metadata: Metadata = { title: "New bill" };

export default async function NewBillPage() {
  const data = await billFormData();
  return (
    <>
      <PageHeader title="New supplier bill" description="Enter the supplier's invoice. Withholding is computed from the ATC on each line and deducted from what you owe." />
      <BillForm {...data} />
    </>
  );
}
