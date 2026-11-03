import { describe, expect, it } from "vitest";
import { billTotals } from "@/lib/bills";
import type { TaxCode } from "@/types";

const code = (id: number, c: string, kind: TaxCode["kind"], rate_bp: number): TaxCode =>
  ({ id, code: c, name: c, kind, rate_bp, rate: (rate_bp / 100).toFixed(2), vat_category: kind === "vat" ? "vatable" : null, is_active: true });
const codes = [code(1, "VAT12", "vat", 1200), code(2, "WC100", "ewt", 500), code(3, "WC160", "ewt", 200)];
const line = (amount: string, account_id: string, vat = "1", ewt = "") => ({ key: amount + account_id, description: "x", amount, account_id, vat_code_id: vat, ewt_code_id: ewt });

describe("billTotals (mirrors the API)", () => {
  it("computes VAT, withholding and the amount due", () => {
    const t = billTotals([line("45000", "1", "1", "2"), line("2000", "2", "1", "3"), line("8000", "3")], codes);
    expect(t).toEqual({ net: 5500000, vat: 660000, ewt: 229000, total: 6160000, due: 5931000, invalid: false });
  });

  it("flags bad amounts", () => {
    expect(billTotals([line("abc", "1")], codes).invalid).toBe(true);
  });
});
