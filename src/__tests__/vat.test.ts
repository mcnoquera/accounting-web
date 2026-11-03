import { describe, expect, it } from "vitest";
import { monthLabel, quarterLabel, quarterOf, vatReconciles } from "@/lib/vat";

describe("calendar quarters", () => {
  it("maps dates to calendar quarters", () => {
    expect(quarterOf("2026-01-01")).toEqual({ year: 2026, quarter: 1 });
    expect(quarterOf("2026-03-31")).toEqual({ year: 2026, quarter: 1 });
    expect(quarterOf("2026-04-01")).toEqual({ year: 2026, quarter: 2 });
    expect(quarterOf("2026-11-03")).toEqual({ year: 2026, quarter: 4 });
  });

  it("labels quarters and months", () => {
    expect(quarterLabel(2026, 4)).toBe("Q4 2026 (Oct–Dec)");
    expect(quarterLabel(2027, 1)).toBe("Q1 2027 (Jan–Mar)");
    expect(monthLabel("2026-10")).toBe("Oct 2026");
  });
});

describe("vatReconciles", () => {
  const b = (output_vat: number, output_vat_from_codes: number, input_vat = 0, input_vat_from_codes = 0) =>
    ({ output_vat, output_vat_from_codes, input_vat, input_vat_from_codes });

  it("allows rounding per entry and flags real gaps", () => {
    expect(vatReconciles(b(120_000, 120_000))).toBe(true);
    expect(vatReconciles(b(120_050, 120_000))).toBe(true);
    expect(vatReconciles(b(120_250, 120_000))).toBe(false);
    expect(vatReconciles(b(120_250, 120_000), 3)).toBe(true);
    expect(vatReconciles(b(0, 0, 36_000, 30_000))).toBe(false);
  });
});
