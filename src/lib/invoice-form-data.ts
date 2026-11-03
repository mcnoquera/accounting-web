import "server-only";
import { getAccounts, getCompany, getContacts, getPeriods, getTaxCodes } from "@/lib/api/endpoints";

/** Everything the invoice form needs, loaded in parallel. */
export async function invoiceFormData() {
  const [customers, accounts, taxCodes, periods, company] = await Promise.all([
    getContacts({ type: "customer", active: "1" }), getAccounts(), getTaxCodes({ kind: "vat" }), getPeriods(), getCompany(),
  ]);
  // VAT-registered sellers default new lines to 12% VAT; others to VAT-exempt.
  const defaultCode = taxCodes.find((c) => c.code === (company?.vat_registered ? "VAT12" : "VATEX"));
  return { customers, accounts, taxCodes, firstOpenDate: periods.first_open_date, defaultVatCodeId: defaultCode ? String(defaultCode.id) : "" };
}
