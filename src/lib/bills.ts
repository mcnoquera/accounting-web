import { parseAmount } from "./money";
import type { TaxCode } from "@/types";

export interface DraftBillLine {
  key: string;
  description: string;
  amount: string;
  account_id: string;
  vat_code_id: string;
  ewt_code_id: string;
}

const taxOn = (cents: number, rateBp: number) => Math.floor((cents * rateBp + 5000) / 10000);

/** Net, VAT, withholding, total and amount due (cents), grouped like the posted entry. */
export function billTotals(lines: DraftBillLine[], codes: TaxCode[]) {
  const byId = new Map(codes.map((c) => [c.id, c]));
  const groups = new Map<string, { amount: number; vat: string; ewt: string }>();
  let net = 0;
  let invalid = false;
  for (const l of lines) {
    const a = parseAmount(l.amount);
    if (a === null) { invalid = true; continue; }
    net += a;
    const key = `${l.account_id}|${l.vat_code_id}|${l.ewt_code_id}`;
    const g = groups.get(key) ?? { amount: 0, vat: l.vat_code_id, ewt: l.ewt_code_id };
    g.amount += a;
    groups.set(key, g);
  }
  let vat = 0;
  let ewt = 0;
  groups.forEach((g) => {
    const v = g.vat ? byId.get(Number(g.vat)) : undefined;
    const w = g.ewt ? byId.get(Number(g.ewt)) : undefined;
    if (v) vat += taxOn(g.amount, v.rate_bp);
    if (w) ewt += taxOn(g.amount, w.rate_bp);
  });
  return { net, vat, ewt, total: net + vat, due: net + vat - ewt, invalid };
}

export const BILL_STATUS_LABEL = { draft: "draft", issued: "recorded", partially_paid: "partly paid", paid: "paid", voided: "voided" } as const;
