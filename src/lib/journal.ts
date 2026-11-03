import { parseAmount } from "./money";

export interface DraftLine {
  key: string;
  account_id: string;
  debit: string;
  credit: string;
  memo: string;
  /** Tax code ids as strings ("" for none); they tag the base line of a sale or purchase. */
  vat_code_id: string;
  ewt_code_id: string;
  /** Customer/supplier id as a string ("" for none); required on control accounts. */
  contact_id: string;
}

export interface LinesSummary {
  debit: number;
  credit: number;
  difference: number;
  /** Lines with an account and an amount. */
  filled: number;
  invalid: string[];
  balanced: boolean;
  canSubmit: boolean;
}

/** Client-side mirror of the API's posting rules, so users see problems before submitting. */
export function summarizeLines(lines: DraftLine[]): LinesSummary {
  let debit = 0;
  let credit = 0;
  let filled = 0;
  const invalid: string[] = [];

  lines.forEach((l, i) => {
    const d = parseAmount(l.debit);
    const c = parseAmount(l.credit);
    if (d === null || c === null) {
      invalid.push(`Line ${i + 1}: amount is not a valid number`);
      return;
    }
    if (d > 0 && c > 0) invalid.push(`Line ${i + 1}: enter a debit or a credit, not both`);
    if ((d > 0 || c > 0) && !l.account_id) invalid.push(`Line ${i + 1}: choose an account`);
    if ((d > 0 || c > 0) && l.account_id) filled++;
    debit += d;
    credit += c;
  });

  const balanced = debit === credit && debit > 0;
  return { debit, credit, difference: debit - credit, filled, invalid, balanced, canSubmit: balanced && filled >= 2 && invalid.length === 0 };
}

let counter = 0;
export function blankLine(): DraftLine {
  counter += 1;
  return { key: `l${Date.now()}-${counter}`, account_id: "", debit: "", credit: "", memo: "", vat_code_id: "", ewt_code_id: "", contact_id: "" };
}
