import { parseAmount } from "./money";
import type { InvoiceStatus, TaxCode } from "@/types";

export interface DraftInvoiceLine {
  key: string;
  description: string;
  quantity: string;
  unit_price: string;
  account_id: string;
  vat_code_id: string;
}

/** "1.5" → 1500; null if not a positive number with at most 3 decimals. */
export function parseQuantity(input: string): number | null {
  const m = input.trim().match(/^(\d+)(?:\.(\d{1,3}))?$/);
  if (!m) return null;
  return Number(m[1]) * 1000 + Number((m[2] ?? "").padEnd(3, "0") || 0);
}

/** Same rounding as the API: quantity × unit price, half up to the centavo. */
export function lineAmount(quantityMilli: number, unitPriceCents: number): number {
  return Math.floor((quantityMilli * unitPriceCents + 500) / 1000);
}

/** Net, VAT (per revenue account and VAT code, like the posted entry) and total, in cents. */
export function invoiceTotals(lines: DraftInvoiceLine[], codes: TaxCode[]) {
  const byCode = new Map(codes.map((c) => [c.id, c]));
  const groups = new Map<string, { amount: number; codeId: number | null }>();
  let net = 0;
  let invalid = false;
  for (const l of lines) {
    const q = parseQuantity(l.quantity);
    const p = parseAmount(l.unit_price);
    if (q === null || p === null) { invalid = true; continue; }
    const amount = lineAmount(q, p);
    net += amount;
    const key = `${l.account_id}|${l.vat_code_id}`;
    const g = groups.get(key) ?? { amount: 0, codeId: l.vat_code_id ? Number(l.vat_code_id) : null };
    g.amount += amount;
    groups.set(key, g);
  }
  let vat = 0;
  groups.forEach((g) => {
    const code = g.codeId ? byCode.get(g.codeId) : undefined;
    if (code) vat += Math.floor((g.amount * code.rate_bp + 5000) / 10000);
  });
  return { net, vat, total: net + vat, invalid };
}

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, "neutral" | "info" | "success" | "warning" | "danger"> = {
  draft: "warning", issued: "info", partially_paid: "info", paid: "success", voided: "neutral",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "draft", issued: "issued", partially_paid: "partly paid", paid: "paid", voided: "voided",
};

export function isOverdue(inv: { status: InvoiceStatus; due_date: string }, today: string): boolean {
  return (inv.status === "issued" || inv.status === "partially_paid") && inv.due_date < today;
}
