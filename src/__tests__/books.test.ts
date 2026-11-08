import { describe, expect, it } from "vitest";
import { bookPeriod, bookPresets, isBook, periodTooLong } from "@/lib/books";
import { isAllowedExportPath } from "@/lib/exports";

describe("books of accounts", () => {
  it("offers month and quarter presets, crossing year ends", () => {
    expect(bookPresets("2026-11-08")).toEqual([
      { label: "This month", from: "2026-11-01", to: "2026-11-30" },
      { label: "Last month", from: "2026-10-01", to: "2026-10-31" },
      { label: "This quarter", from: "2026-10-01", to: "2026-12-31" },
      { label: "Last quarter", from: "2026-07-01", to: "2026-09-30" },
    ]);
    const jan = bookPresets("2027-01-15");
    expect(jan[1]).toMatchObject({ from: "2026-12-01", to: "2026-12-31" });
    expect(jan[3]).toMatchObject({ from: "2026-10-01", to: "2026-12-31" });
    expect(bookPresets("2028-02-10")[0].to).toBe("2028-02-29");
  });

  it("uses the URL period when valid, else this month", () => {
    expect(bookPeriod("2026-01-01", "2026-03-31", "2026-11-08")).toEqual({ from: "2026-01-01", to: "2026-03-31" });
    expect(bookPeriod("2026-03-31", "2026-01-01", "2026-11-08")).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(bookPeriod(undefined, "x", "2026-11-08")).toEqual({ from: "2026-11-01", to: "2026-11-30" });
  });

  it("limits a period to one year", () => {
    expect(periodTooLong("2026-01-01", "2026-12-31")).toBe(false);
    expect(periodTooLong("2028-01-01", "2028-12-31")).toBe(false); // leap year, 366 days
    expect(periodTooLong("2026-01-01", "2027-01-01")).toBe(false); // 366 days
    expect(periodTooLong("2026-01-01", "2027-01-02")).toBe(true);
  });

  it("knows the books and allows only their exports", () => {
    expect(isBook("sales")).toBe(true);
    expect(isBook("payroll")).toBe(false);
    expect(isBook("toString")).toBe(false);
    expect(isAllowedExportPath("/books/cash-receipts/export")).toBe(true);
    expect(isAllowedExportPath("/books/sales")).toBe(false);
    expect(isAllowedExportPath("/books/payroll/export")).toBe(false);
  });
});
