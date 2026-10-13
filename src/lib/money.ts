/** All amounts from the API are integer cents. */

const formatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatCents(cents: number): string {
  const abs = formatter.format(Math.abs(cents) / 100);
  return cents < 0 ? `(${abs})` : abs;
}

/** Converts a user-typed amount ("1,250.5") to cents, or null if it isn't a valid non-negative amount. */
export function parseAmount(input: string): number | null {
  const s = input.replace(/,/g, "").trim();
  if (s === "") return 0;
  const m = /^(\d+)(?:\.(\d{0,2}))?$/.exec(s);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
}

/** Cents back to the plain decimal string the API accepts ("1250.50"). */
export function centsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}
