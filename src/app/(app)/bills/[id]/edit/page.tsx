import { redirect } from "next/navigation";
import { getBill } from "@/lib/api/endpoints";
import { billFormData } from "@/lib/bill-form-data";
import { PageHeader } from "@/components/ui/page-header";
import { BillForm } from "@/components/features/bills/bill-form";

export default async function EditBillPage({ params }: { params: { id: string } }) {
  const [bill, data] = await Promise.all([getBill(params.id), billFormData()]);
  if (bill.status !== "draft") redirect(`/bills/${bill.id}`);
  return (
    <>
      <PageHeader title="Edit draft bill" description="Only drafts can be edited." />
      <BillForm bill={bill} {...data} />
    </>
  );
}
