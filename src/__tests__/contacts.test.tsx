import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { acceptsContact, contactsForAccount, missingContacts } from "@/lib/contacts";
import { EntryForm } from "@/components/features/journal/entry-form";
import type { Account, Contact } from "@/types";

vi.mock("react-dom", async (orig) => ({
  ...(await orig<typeof import("react-dom")>()),
  useFormState: (_action: unknown, initial: unknown) => [initial, vi.fn()],
  useFormStatus: () => ({ pending: false }),
}));
vi.mock("@/app/actions/journal", () => ({ saveEntry: vi.fn() }));

const acct = (id: number, code: string, type: Account["type"], control_type: Account["control_type"] = null): Account => ({
  id, code, name: `Acct ${code}`, type, parent_id: null, tax_role: null, control_type,
  normal_balance: type === "asset" || type === "expense" ? "debit" : "credit", description: null, is_active: true,
});
const accounts = [acct(1, "1110", "asset"), acct(2, "1210", "asset", "receivable"), acct(3, "2110", "liability", "payable"), acct(4, "4010", "revenue")];
const contact = (id: number, name: string, type: Contact["type"], is_active = true): Contact =>
  ({ id, name, type, tin: null, address: null, email: null, phone: null, payment_terms_days: 30, is_active });
const contacts = [contact(1, "Customer A", "customer"), contact(2, "Supplier B", "supplier"), contact(3, "Both C", "both"), contact(4, "Old D", "customer", false)];

describe("contact rules", () => {
  it("matches contact types to control accounts", () => {
    expect([acceptsContact("receivable", "customer"), acceptsContact("receivable", "supplier"), acceptsContact("payable", "both")]).toEqual([true, false, true]);
  });

  it("offers the right active contacts per line, keeping the current one", () => {
    expect(contactsForAccount(contacts, accounts[1]).map((c) => c.name)).toEqual(["Customer A", "Both C"]);
    expect(contactsForAccount(contacts, accounts[2]).map((c) => c.name)).toEqual(["Supplier B", "Both C"]);
    expect(contactsForAccount(contacts, accounts[0]).map((c) => c.name)).toEqual(["Customer A", "Supplier B", "Both C"]);
    expect(contactsForAccount(contacts, accounts[1], 4).map((c) => c.name)).toContain("Old D");
  });

  it("flags control lines without a contact", () => {
    const lines = [
      { account_id: "2", contact_id: "", debit: "100", credit: "" },
      { account_id: "4", contact_id: "", debit: "", credit: "100" },
      { account_id: "3", contact_id: "2", debit: "", credit: "5" },
    ];
    expect(missingContacts(lines, accounts)).toEqual(["Line 1: choose the customer for 1210"]);
  });
});

describe("EntryForm contacts", () => {
  it("requires a customer on a receivable line before saving", async () => {
    const u = userEvent.setup();
    render(<EntryForm accounts={accounts} contacts={contacts} />);
    await u.type(screen.getByLabelText("Description"), "Invoice");
    await u.selectOptions(screen.getByLabelText("Line 1 account"), "2");
    await u.type(screen.getByLabelText("Line 1 debit"), "100");
    await u.selectOptions(screen.getByLabelText("Line 2 account"), "4");
    await u.type(screen.getByLabelText("Line 2 credit"), "100");

    expect(screen.getByText("Line 1: choose the customer for 1210")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();

    const picker = screen.getByLabelText("Line 1 contact");
    expect(Array.from((picker as HTMLSelectElement).options).map((o) => o.text)).toEqual(["Choose customer…", "Customer A", "Both C"]);
    await u.selectOptions(picker, "1");
    expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
  });
});
