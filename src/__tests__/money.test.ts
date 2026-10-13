import { describe, expect, it } from "vitest";
import { centsToDecimal, formatCents, parseAmount } from "@/lib/money";

describe("parseAmount", () => {
  it.each([
    ["", 0], ["0", 0], ["12", 1200], ["12.5", 1250], ["12.05", 1205], ["1,250.50", 125050], ["0.1", 10], [" 7 ", 700], ["5.", 500],
  ])("parses %j as %i cents", (input, cents) => {
    expect(parseAmount(input)).toBe(cents);
  });

  it.each(["-5", "1.234", "abc", "1e3", "1.2.3"])("rejects %j", (input) => {
    expect(parseAmount(input)).toBeNull();
  });
});

describe("formatCents", () => {
  it("formats with thousands separators", () => {
    expect(formatCents(123456789)).toBe("1,234,567.89");
  });
  it("shows negatives in accounting parentheses", () => {
    expect(formatCents(-2050)).toBe("(20.50)");
  });
});

describe("centsToDecimal", () => {
  it("round-trips through parseAmount", () => {
    expect(parseAmount(centsToDecimal(10)) ).toBe(10);
    expect(centsToDecimal(125050)).toBe("1250.50");
  });
});
