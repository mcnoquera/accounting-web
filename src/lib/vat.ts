import type { VatBucket } from "@/types";
import { TAX_TOLERANCE } from "./tax";

/** Calendar quarter (1–4) containing an ISO date. */
export function quarterOf(iso: string): { year: number; quarter: number } {
  const [y, m] = iso.split("-").map(Number);
  return { year: y, quarter: Math.floor((m - 1) / 3) + 1 };
}

/** "Q4 2026 (Oct–Dec)" */
export function quarterLabel(year: number, quarter: number): string {
  const months = ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"][quarter - 1];
  return `Q${quarter} ${year} (${months})`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/** Whether VAT booked on coded entries matches what the codes imply (within rounding per entry). */
export function vatReconciles(b: Pick<VatBucket, "output_vat" | "input_vat" | "output_vat_from_codes" | "input_vat_from_codes">, entries = 1): boolean {
  const tol = TAX_TOLERANCE * Math.max(entries, 1);
  return Math.abs(b.output_vat - b.output_vat_from_codes) <= tol && Math.abs(b.input_vat - b.input_vat_from_codes) <= tol;
}
