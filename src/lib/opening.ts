import { parseAmount } from "./money";
import type { Account } from "@/types";

export type OpeningDoc = { key: string; contact_id: string; number: string; date: string; due_date: string; amount: string };

/** Opening position: debit-normal accounts take debits, the rest credits; the difference goes to Opening Balance Equity. */
export function openingDifference(balances: Record<number, string>, accounts: Account[], receivables: OpeningDoc[], payables: OpeningDoc[]): number {
  let net = 0;
  for (const a of accounts) {
    const v = parseAmount(balances[a.id] ?? "") ?? 0;
    net += a.normal_balance === "debit" ? v : -v;
  }
  net += receivables.reduce((s, d) => s + (parseAmount(d.amount) ?? 0), 0);
  net -= payables.reduce((s, d) => s + (parseAmount(d.amount) ?? 0), 0);
  return net; // positive: credit to Opening Balance Equity
}

