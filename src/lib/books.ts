/** BIR books of accounts (US-20): the six books and the period picker's presets. */
export const BOOKS = {
  "general-journal": "General journal",
  "general-ledger": "General ledger",
  sales: "Sales book",
  purchases: "Purchase book",
  "cash-receipts": "Cash receipts journal",
  "cash-disbursements": "Cash disbursements journal",
} as const;

export type BookKey = keyof typeof BOOKS;

export function isBook(value: string | undefined): value is BookKey {
  return value !== undefined && Object.prototype.hasOwnProperty.call(BOOKS, value);
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const pad = (n: number) => String(n).padStart(2, "0");
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m is 1-based

function monthRange(y: number, m: number): { from: string; to: string } {
  while (m < 1) { m += 12; y -= 1; }
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(lastDay(y, m))}` };
}

function quarterRange(y: number, q: number): { from: string; to: string } {
  while (q < 1) { q += 4; y -= 1; }
  const first = (q - 1) * 3 + 1;
  return { from: monthRange(y, first).from, to: monthRange(y, first + 2).to };
}

/** Quick periods relative to today: this and last month, this and last calendar quarter. */
export function bookPresets(todayIso: string): { label: string; from: string; to: string }[] {
  const y = Number(todayIso.slice(0, 4));
  const m = Number(todayIso.slice(5, 7));
  const q = Math.ceil(m / 3);
  return [
    { label: "This month", ...monthRange(y, m) },
    { label: "Last month", ...monthRange(y, m - 1) },
    { label: "This quarter", ...quarterRange(y, q) },
    { label: "Last quarter", ...quarterRange(y, q - 1) },
  ];
}

/** The period from the URL, defaulting to the current month (also when the dates are missing or invalid). */
export function bookPeriod(from: string | undefined, to: string | undefined, todayIso: string): { from: string; to: string } {
  if (from && to && ISO.test(from) && ISO.test(to) && from <= to) return { from, to };
  const { from: f, to: t } = bookPresets(todayIso)[0];
  return { from: f, to: t };
}

/** The API accepts up to one year per request (366 days counting both ends). */
export function periodTooLong(from: string, to: string): boolean {
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000 >= 366;
}
