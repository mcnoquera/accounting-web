import type { Account, Contact, ContactType, ControlType } from "@/types";

export const CONTACT_TYPE_LABEL: Record<ContactType, string> = { customer: "Customer", supplier: "Supplier", both: "Customer & supplier" };

export function acceptsContact(control: ControlType, type: ContactType): boolean {
  return control === "receivable" ? type !== "supplier" : type !== "customer";
}

/** Contacts offered on a line: control accounts get customers or suppliers only; other lines get everyone. */
export function contactsForAccount(contacts: Contact[], account: Account | undefined, keepId?: number): Contact[] {
  return contacts.filter((c) =>
    c.id === keepId || (c.is_active && (!account?.control_type || acceptsContact(account.control_type, c.type))));
}

/** Messages for lines on control accounts that are missing a contact (mirrors the API rule). */
export function missingContacts(lines: { account_id: string; contact_id: string; debit: string; credit: string }[], accounts: Account[]): string[] {
  const byId = new Map(accounts.map((a) => [a.id, a]));
  return lines.flatMap((l, i) => {
    const a = l.account_id ? byId.get(Number(l.account_id)) : undefined;
    if (!a?.control_type || l.contact_id || (!l.debit && !l.credit)) return [];
    return [`Line ${i + 1}: choose the ${a.control_type === "receivable" ? "customer" : "supplier"} for ${a.code}`];
  });
}

export const AGING_COLUMNS = [
  { key: "current", label: "Current" },
  { key: "days_1_30", label: "1–30" },
  { key: "days_31_60", label: "31–60" },
  { key: "days_61_90", label: "61–90" },
  { key: "over_90", label: "Over 90" },
] as const;
