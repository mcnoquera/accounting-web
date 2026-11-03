import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { checkTax, taxFixes, taxOn, taxTarget } from "@/lib/tax";
import { EntryForm } from "@/components/features/journal/entry-form";
import type { Account, TaxCode } from "@/types";

vi.mock("react-dom", async (orig) => ({
  ...(await orig<typeof import("react-dom")>()),
  useFormState: (_action: unknown, initial: unknown) => [initial, vi.fn()],
  useFormStatus: () => ({ pending: false }),
}));
vi.mock("@/app/actions/journal", () => ({ saveEntry: vi.fn() }));

const acct = (id: number, code: string, type: Account["type"], tax_role: Account["tax_role"] = null): Account => ({
  id, code, name: `Acct ${code}`, type, parent_id: null, tax_role, control_type: null, normal_balance: type === "asset" || type === "expense" ? "debit" : "credit", description: null, is_active: true,
});
const accounts = [
  acct(1, "1110", "asset"), acct(2, "1420", "asset", "input_vat"), acct(3, "1430", "asset", "cwt_receivable"),
  acct(4, "2110", "liability"), acct(5, "2210", "liability", "output_vat"), acct(6, "2230", "liability", "ewt_payable"),
  acct(7, "4010", "revenue"), acct(8, "6010", "expense"),
];
const code = (id: number, c: string, kind: TaxCode["kind"], rate_bp: number): TaxCode => ({
  id, code: c, name: c, kind, rate_bp, rate: (rate_bp / 100).toFixed(2), vat_category: kind === "vat" ? (rate_bp ? "vatable" : "exempt") : null, is_active: true,
});
const codes = [code(1, "VAT12", "vat", 1200), code(2, "VATEX", "vat", 0), code(3, "WC160", "ewt", 200), code(4, "WI010", "ewt", 500)];
const line = (account_id: number, debit: number, credit: number, vat: number | null = null, ewt: number | null = null) =>
  ({ account_id, debit, credit, vat_code_id: vat, ewt_code_id: ewt });

describe("tax math", () => {
  it("rounds half up like the API", () => {
    expect(taxOn(1234567, 500)).toBe(61728); // 617.2835 → 617.28
    expect(taxOn(1000, 1200)).toBe(120);
    expect(taxOn(4, 1250)).toBe(1); // 0.5 cent rounds up
  });

  it("routes VAT and withholding by side", () => {
    expect([taxTarget("vat", true), taxTarget("vat", false), taxTarget("ewt", true), taxTarget("ewt", false)])
      .toEqual(["output_vat", "input_vat", "cwt_receivable", "ewt_payable"]);
  });
});

describe("checkTax", () => {
  it("expects output VAT and creditable withholding on a sale", () => {
    const checks = checkTax([line(1, 1_080_000, 0), line(7, 0, 1_000_000, 1, 3), line(5, 0, 120_000)], accounts, codes);
    expect(checks).toEqual([
      { role: "output_vat", expected: -120_000, actual: -120_000, ok: true },
      { role: "cwt_receivable", expected: 20_000, actual: 0, ok: false },
    ]);
    expect(taxFixes(checks, accounts)).toEqual([{ role: "cwt_receivable", account: accounts[2], debit: 20_000, credit: 0 }]);
  });

  it("ignores zero-rate codes and lines on tax accounts", () => {
    expect(checkTax([line(7, 0, 5000, 2), line(1, 5000, 0)], accounts, codes)).toEqual([]);
    expect(checkTax([line(2, 120, 0, 1), line(1, 0, 120)], accounts, codes)).toEqual([]);
  });

  it("allows one peso of rounding", () => {
    const [c] = checkTax([line(8, 1_234_567, 0, null, 4), line(6, 0, 61_700), line(1, 0, 1_172_867)], accounts, codes);
    expect(c).toMatchObject({ role: "ewt_payable", expected: -61_728, actual: -61_700, ok: true });
  });

  it("reports a missing tax account", () => {
    const noVat = accounts.filter((a) => a.tax_role !== "input_vat");
    const fixes = taxFixes(checkTax([line(8, 100_000, 0, 1), line(4, 0, 100_000)], noVat, codes), noVat);
    expect(fixes).toEqual([{ role: "input_vat", account: null, debit: 12_000, credit: 0 }]);
  });
});

describe("EntryForm tax lines", () => {
  it("adds the VAT and withholding lines for a coded purchase", async () => {
    const u = userEvent.setup();
    render(<EntryForm accounts={accounts} taxCodes={codes} />);

    await u.selectOptions(screen.getByLabelText("Line 1 account"), "8");
    await u.type(screen.getByLabelText("Line 1 debit"), "50000");
    await u.selectOptions(screen.getByLabelText("Line 1 VAT code"), "1");
    await u.selectOptions(screen.getByLabelText("Line 1 withholding code"), "4");

    const panel = screen.getByTestId("tax-check");
    expect(within(panel).getByText("Input VAT")).toBeInTheDocument();
    await u.click(within(panel).getByRole("button", { name: /Add tax lines/ }));

    // Line 3 = Input VAT debit 6,000; line 4 = EWT payable credit 2,500.
    expect(screen.getByLabelText("Line 3 account")).toHaveValue("2");
    expect(screen.getByLabelText("Line 3 debit")).toHaveValue("6000.00");
    expect(screen.getByLabelText("Line 4 account")).toHaveValue("6");
    expect(screen.getByLabelText("Line 4 credit")).toHaveValue("2500.00");
    expect(screen.queryByRole("button", { name: /Add tax lines/ })).not.toBeInTheDocument();
    // Tax accounts don't offer tax codes.
    expect(screen.queryByLabelText("Line 3 VAT code")).not.toBeInTheDocument();
  });
});
