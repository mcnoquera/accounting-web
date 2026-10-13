import { describe, expect, it } from "vitest";
import { blankLine, summarizeLines, type DraftLine } from "@/lib/journal";

const line = (account_id: string, debit = "", credit = ""): DraftLine => ({ ...blankLine(), account_id, debit, credit });

describe("summarizeLines", () => {
  it("is balanced and submittable when debits equal credits", () => {
    const s = summarizeLines([line("1", "100.10"), line("2", "", "100.1")]);
    expect(s).toMatchObject({ debit: 10010, credit: 10010, difference: 0, balanced: true, canSubmit: true });
  });

  it("reports the difference when out of balance", () => {
    const s = summarizeLines([line("1", "100"), line("2", "", "99.99")]);
    expect(s.balanced).toBe(false);
    expect(s.difference).toBe(1);
    expect(s.canSubmit).toBe(false);
  });

  it("is not balanced when everything is zero", () => {
    expect(summarizeLines([line(""), line("")]).balanced).toBe(false);
  });

  it("flags a line with both a debit and a credit", () => {
    const s = summarizeLines([line("1", "5", "5"), line("2", "5"), line("3", "", "5")]);
    expect(s.invalid).toContain("Line 1: enter a debit or a credit, not both");
    expect(s.canSubmit).toBe(false);
  });

  it("flags an amount without an account", () => {
    const s = summarizeLines([line("", "5"), line("2", "", "5")]);
    expect(s.invalid).toContain("Line 1: choose an account");
    expect(s.canSubmit).toBe(false);
  });

  it("flags unparseable amounts", () => {
    const s = summarizeLines([line("1", "abc"), line("2", "", "5")]);
    expect(s.invalid[0]).toMatch(/not a valid number/);
  });
});
