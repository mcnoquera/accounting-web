import "server-only";
import { getAccounts, getBills, getContacts, getInvoices, getPeriods, getTaxCodes } from "@/lib/api/endpoints";
import type { OpenDocument } from "@/lib/payments";
import type { PaymentDirection } from "@/types";

/** Open invoices/bills grouped by contact, plus the lists the payment form needs. */
export async function paymentFormData(direction: PaymentDirection) {
  const receipt = direction === "receipt";
  const [contacts, accounts, periods, codes, docs] = await Promise.all([
    getContacts({ type: receipt ? "customer" : "supplier", active: "1" }),
    getAccounts({ active: "1" }),
    getPeriods(),
    receipt ? getTaxCodes({ kind: "ewt", active: "1" }) : Promise.resolve([]),
    receipt ? getInvoices({ status: "open", per_page: "100" }).then((p) => p.data) : getBills({ status: "open", per_page: "100" }).then((p) => p.data),
  ]);
  const openDocs: Record<number, OpenDocument[]> = {};
  for (const d of docs) {
    const doc: OpenDocument = { id: d.id, number: d.number, due_date: d.due_date, balance_due: d.balance_due, net_amount: d.net_amount, total_amount: d.total_amount };
    (openDocs[d.contact_id] ??= []).push(doc);
  }
  return {
    contacts,
    cashAccounts: accounts.filter((a) => a.is_cash),
    openDocs,
    ewtCodes: codes,
    firstOpenDate: periods.first_open_date,
  };
}
