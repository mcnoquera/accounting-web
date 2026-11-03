/** API paths the /export route may forward to. Anything else is refused, so it can't proxy arbitrary API calls. */
const ALLOWED = [
  /^\/reports\/(trial-balance|balance-sheet|income-statement|vat-summary|aging|withholding|withholding-payees|percentage-tax)\/export$/,
  /^\/accounts\/\d+\/ledger\/export$/,
  /^\/audit\/logs\/export$/,
];

export function isAllowedExportPath(path: string): boolean {
  return ALLOWED.some((re) => re.test(path));
}

export type ExportFormat = "csv" | "pdf";

/** Link to download an export through the web app's /export route, keeping the page's filters. */
export function exportHref(apiPath: string, format: ExportFormat, params: Record<string, string | number | undefined | null> = {}): string {
  const q = new URLSearchParams({ format });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "" && k !== "page") q.set(k, String(v));
  }
  return `/export${apiPath}?${q.toString()}`;
}
