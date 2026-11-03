import "server-only";
import { getAccounts, getCompany, getContacts, getPeriods, getTaxCodes } from "@/lib/api/endpoints";

export async function billFormData() {
  const [suppliers, accounts, taxCodes, periods, company] = await Promise.all([
    getContacts({ type: "supplier", active: "1" }), getAccounts(), getTaxCodes({ active: "1" }), getPeriods(), getCompany(),
  ]);
  const defaultCode = company?.vat_registered ? taxCodes.find((c) => c.code === "VAT12") : undefined;
  return { suppliers, accounts, taxCodes, firstOpenDate: periods.first_open_date, defaultVatCodeId: defaultCode ? String(defaultCode.id) : "" };
}
