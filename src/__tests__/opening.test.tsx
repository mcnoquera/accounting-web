import { describe, expect, it } from "vitest";
import { openingDifference } from "@/lib/opening";
import type { Account } from "@/types";

const acct = (id: number, type: Account["type"]): Account => ({ id, code: String(id), name: `A${id}`, type, parent_id: null, tax_role: null, control_type: null, normal_balance: type === "asset" || type === "expense" ? "debit" : "credit", description: null, is_active: true });

describe("openingDifference", () => {
  it("nets balances and documents into the equity difference", () => {
    const accounts = [acct(1, "asset"), acct(2, "liability"), acct(3, "equity")];
    const doc = (amount: string) => ({ key: amount, contact_id: "1", number: "x", date: "2026-06-01", due_date: "", amount });
    // 500k + 120k... here: bank 500,000 Dr, loan 200,000 Cr, capital 300,000 Cr, AR 70,000, AP 30,000 → 40,000 Cr to OBE
    expect(openingDifference({ 1: "500000", 2: "200000", 3: "300000" }, accounts, [doc("70000")], [doc("30000")])).toBe(4000000);
    expect(openingDifference({}, accounts, [], [])).toBe(0);
  });
});
