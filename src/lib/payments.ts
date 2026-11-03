import { parseAmount } from "./money";

export interface OpenDocument {
  id: number;
  number: string | null;
  due_date: string;
  /** Cents still owed. */
  balance_due: number;
  /** For receipts: net (before VAT) and total, to suggest the withholding base. */
  net_amount?: number;
  total_amount?: number;
}

/** Applies `available` cents to documents, oldest due date first. Returns cents per document id. */
export function autoAllocate(available: number, docs: OpenDocument[]): Record<number, number> {
  const out: Record<number, number> = {};
  let left = available;
  for (const d of [...docs].sort((a, b) => a.due_date.localeCompare(b.due_date) || a.id - b.id)) {
    if (left <= 0) break;
    const take = Math.min(left, d.balance_due);
    if (take > 0) out[d.id] = take;
    left -= take;
  }
  return out;
}

/** Net (pre-VAT) share of what's allocated to invoices: the usual base for the customer's withholding. */
export function suggestedWithholdingBase(allocations: Record<number, number>, docs: OpenDocument[]): number {
  let base = 0;
  for (const d of docs) {
    const a = allocations[d.id] ?? 0;
    if (a && d.net_amount && d.total_amount) base += Math.round((a * d.net_amount) / d.total_amount);
  }
  return base;
}

export function withholdingOn(baseCents: number, rateBp: number): number {
  return Math.floor((baseCents * rateBp + 5000) / 10000);
}

/** Cents from an input string, or 0 when blank/invalid. */
export const cents = (s: string) => parseAmount(s) ?? 0;
