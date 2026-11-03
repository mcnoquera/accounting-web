import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { invoiceTotals, isOverdue, lineAmount, parseQuantity } from "@/lib/invoices";
import { InvoiceForm } from "@/components/features/invoices/invoice-form";
import type { Account, Contact, TaxCode } from "@/types";

vi.mock("react-dom", async (orig) => ({
  ...(await orig<typeof import("react-dom")>()),
  useFormState: (_action: unknown, initial: unknown) => [initial, vi.fn()],
  useFormStatus: () => ({ pending: false }),
}));
vi.mock("@/app/actions/invoices", () => ({ saveInvoice: vi.fn() }));

const code = (id: number, c: string, rate_bp: number, cat: TaxCode["vat_category"]): TaxCode =>
  ({ id, code: c, name: c, kind: "vat", rate_bp, rate: (rate_bp / 100).toFixed(2), vat_category: cat, is_active: true });
const codes = [code(1, "VAT12", 1200, "vatable"), code(2, "VAT0", 0, "zero_rated")];
const line = (quantity: string, unit_price: string, account_id = "10", vat_code_id = "1") => ({ key: Math.random().toString(), description: "x", quantity, unit_price, account_id, vat_code_id });

describe("invoice maths (mirrors the API)", () => {
  it("parses quantities and rounds amounts half up", () => {
    expect([parseQuantity("1.5"), parseQuantity("10"), parseQuantity("0.125"), parseQuantity("1.2345"), parseQuantity("-1")]).toEqual([1500, 10000, 125, null, null]);
    expect(lineAmount(1500, 33333)).toBe(50000); // 499.995 → 500.00
    expect(lineAmount(125, 1)).toBe(0);
  });

  it("computes VAT per account and code like the posted entry", () => {
    const t = invoiceTotals([line("10", "1250"), line("1.5", "333.33", "11"), line("1", "200", "10", "2")], codes);
    expect(t).toEqual({ net: 1320000, vat: 156000, total: 1476000, invalid: false });
    expect(invoiceTotals([line("abc", "1")], codes).invalid).toBe(true);
  });

  it("flags overdue open invoices only", () => {
    expect(isOverdue({ status: "issued", due_date: "2026-11-01" }, "2026-11-15")).toBe(true);
    expect(isOverdue({ status: "paid", due_date: "2026-11-01" }, "2026-11-15")).toBe(false);
    expect(isOverdue({ status: "issued", due_date: "2026-11-15" }, "2026-11-15")).toBe(false);
  });
});

describe("InvoiceForm", () => {
  const acct = (id: number, c: string, type: Account["type"]): Account => ({ id, code: c, name: `Acct ${c}`, type, parent_id: null, tax_role: null, control_type: null, normal_balance: "credit", description: null, is_active: true });
  const customers: Contact[] = [{ id: 7, name: "Mabuhay Retail", type: "customer", tin: "200-333-444-000", address: null, email: null, phone: null, payment_terms_days: 30, is_active: true }];

  it("offers revenue accounts only and shows live totals", async () => {
    const u = userEvent.setup();
    render(<InvoiceForm customers={customers} accounts={[acct(10, "4100", "revenue"), acct(20, "6040", "expense")]} taxCodes={codes} defaultVatCodeId="1" />);
    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();

    await u.selectOptions(screen.getByLabelText("Customer"), "7");
    expect(screen.getByText("TIN 200-333-444-000 · 30-day terms")).toBeInTheDocument();
    await u.type(screen.getByLabelText("Line 1 description"), "Rice");
    await u.clear(screen.getByLabelText("Line 1 quantity"));
    await u.type(screen.getByLabelText("Line 1 quantity"), "10");
    await u.type(screen.getByLabelText("Line 1 unit price"), "1250");
    const accountSelect = screen.getByLabelText("Line 1 account");
    expect(Array.from((accountSelect as HTMLSelectElement).options).map((o) => o.text)).toEqual(["Account…", "4100 · Acct 4100"]);
    await u.selectOptions(accountSelect, "10");

    const totals = screen.getByTestId("invoice-totals");
    expect(within(totals).getByText("14,000.00")).toBeInTheDocument();
    expect(within(totals).getByText("1,500.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save & issue" })).toBeEnabled();
  });
});
