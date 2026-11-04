import type { Metadata } from "next";
import { getAccounts, getPeriods } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/ui/page-header";
import { TransferForm } from "@/components/features/payments/transfer-form";

export const metadata: Metadata = { title: "Transfer between accounts" };

export default async function TransferPage() {
  const [accounts, periods] = await Promise.all([getAccounts({ active: "1" }), getPeriods()]);
  return (
    <>
      <PageHeader title="Transfer between accounts" description="Move money between cash, bank and e-wallet accounts (e.g. GCash cash-out to BPI). Not income or an expense; a fee goes to the expense account you choose." />
      <TransferForm cashAccounts={accounts.filter((a) => a.is_cash)} expenseAccounts={accounts.filter((a) => a.type === "expense")} firstOpenDate={periods.first_open_date} />
    </>
  );
}
