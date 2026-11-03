import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { autoAllocate, suggestedWithholdingBase, withholdingOn } from "@/lib/payments";
import { PaymentForm } from "@/components/features/payments/payment-form";
import type { Account, Contact, TaxCode } from "@/types";

vi.mock("react-dom", async (orig) => ({
  ...(await orig<typeof import("react-dom")>()),
  useFormState: (_action: unknown, initial: unknown) => [initial, vi.fn()],
  useFormStatus: () => ({ pending: false }),
}));
vi.mock("@/app/actions/payments", () => ({ recordPayment: vi.fn() }));

const docs = [
  { id: 2, number: "SI-000002", due_date: "2026-12-01", balance_due: 224000, net_amount: 200000, total_amount: 224000 },
  { id: 1, number: "SI-000001", due_date: "2026-08-31", balance_due: 112000, net_amount: 100000, total_amount: 112000 },
];

describe("payment helpers", () => {
  it("applies oldest due first and stops when the money runs out", () => {
    expect(autoAllocate(200000, docs)).toEqual({ 1: 112000, 2: 88000 });
    expect(autoAllocate(500000, docs)).toEqual({ 1: 112000, 2: 224000 });
  });

  it("suggests the net (pre-VAT) share as the withholding base", () => {
    expect(suggestedWithholdingBase({ 1: 112000, 2: 112000 }, docs)).toBe(200000);
    expect(withholdingOn(1000000, 200)).toBe(20000);
  });
});

describe("PaymentForm (receipt)", () => {
  const contacts: Contact[] = [{ id: 7, name: "Client Corp", type: "customer", tin: null, address: null, email: null, phone: null, payment_terms_days: 30, is_active: true }];
  const bank: Account = { id: 9, code: "1130", name: "Cash in Bank", type: "asset", parent_id: null, tax_role: null, control_type: null, is_cash: true, normal_balance: "debit", description: null, is_active: true };
  const wc160: TaxCode = { id: 5, code: "WC160", name: "Services", kind: "ewt", rate_bp: 200, rate: "2.00", vat_category: null, is_active: true };

  it("applies the receipt plus 2307 withholding to open invoices", async () => {
    const u = userEvent.setup();
    render(<PaymentForm direction="receipt" contacts={contacts} cashAccounts={[bank]} openDocs={{ 7: docs }} ewtCodes={[wc160]} />);
    await u.selectOptions(screen.getByLabelText("Customer"), "7");
    await u.type(screen.getByLabelText("Amount received"), "3300");
    await u.selectOptions(screen.getByLabelText(/Tax withheld by the customer/), "5");
    await u.type(screen.getByLabelText("Income payment (base)"), "3000");
    expect(screen.getByLabelText("Amount withheld")).toHaveValue("60.00");

    await u.click(screen.getByRole("button", { name: "Apply oldest first" }));
    expect(screen.getByLabelText("Apply to SI-000001")).toHaveValue("1120.00");
    expect(screen.getByLabelText("Apply to SI-000002")).toHaveValue("2240.00");
    expect(screen.getByTestId("allocation-summary")).toHaveTextContent("Applied 3,360.00 of 3,360.00 · unapplied 0.00");
    expect(screen.getByRole("button", { name: "Record receipt" })).toBeEnabled();
  });

  it("blocks over-allocation", async () => {
    const u = userEvent.setup();
    render(<PaymentForm direction="receipt" contacts={contacts} cashAccounts={[bank]} openDocs={{ 7: docs }} ewtCodes={[]} />);
    await u.selectOptions(screen.getByLabelText("Customer"), "7");
    await u.type(screen.getByLabelText("Amount received"), "100");
    await u.type(screen.getByLabelText("Apply to SI-000001"), "500");
    expect(screen.getByRole("button", { name: "Record receipt" })).toBeDisabled();
  });
});
