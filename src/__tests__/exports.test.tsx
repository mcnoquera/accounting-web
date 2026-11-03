import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { exportHref, isAllowedExportPath } from "@/lib/exports";
import { ExportButtons } from "@/components/features/export-buttons";

describe("isAllowedExportPath", () => {
  it("only forwards export endpoints", () => {
    for (const ok of ["/reports/trial-balance/export", "/reports/vat-summary/export", "/accounts/12/ledger/export", "/audit/logs/export", "/reports/aging/export", "/reports/withholding/export", "/reports/withholding-payees/export", "/reports/percentage-tax/export", "/sales-invoices/3/pdf", "/imports/accounts/template"]) {
      expect(isAllowedExportPath(ok)).toBe(true);
    }
    for (const bad of ["/users", "/reports/trial-balance", "/reports/payroll/export", "/accounts/x/ledger/export",
      "/accounts/1/ledger/export/../../users", "/reports/trial-balance/export?x", "//evil.com/reports/trial-balance/export", "/sales-invoices/3", "/sales-invoices/x/pdf"]) {
      expect(isAllowedExportPath(bad)).toBe(false);
    }
  });
});

describe("exportHref", () => {
  it("keeps filters, drops empty values and pagination", () => {
    expect(exportHref("/reports/income-statement/export", "pdf", { from: "2026-01-01", to: "2026-03-31" }))
      .toBe("/export/reports/income-statement/export?format=pdf&from=2026-01-01&to=2026-03-31");
    expect(exportHref("/audit/logs/export", "csv", { action: "", page: "3", type: "JournalEntry" }))
      .toBe("/export/audit/logs/export?format=csv&type=JournalEntry");
  });
});

describe("ExportButtons", () => {
  it("renders a download link per format", () => {
    render(<ExportButtons apiPath="/reports/vat-summary/export" params={{ year: 2026, quarter: 4 }} />);
    expect(screen.getByRole("link", { name: /CSV/ })).toHaveAttribute("href", "/export/reports/vat-summary/export?format=csv&year=2026&quarter=4");
    expect(screen.getByRole("link", { name: /PDF/ })).toHaveAttribute("download");
  });
});
