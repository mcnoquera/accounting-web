import type { Account, TaxCode, TaxKind, TaxRole } from "@/types";
import { TAX_ROLES } from "@/types";

/** Allowed difference per tax role, matching the API (₱1). */
export const TAX_TOLERANCE = 100;

export const taxRoleLabel = (role: TaxRole) => TAX_ROLES.find((r) => r.value === role)?.label ?? role;

/** Tax on a base amount in cents, rounded half up (same as the API). */
export function taxOn(baseCents: number, rateBp: number): number {
  return Math.floor((baseCents * rateBp + 5000) / 10000);
}

/**
 * Where a code's tax goes. VAT follows the base line's side; withholding goes on the other side.
 * Revenue lines are sales, everything else purchases.
 */
export function taxTarget(kind: TaxKind, isSale: boolean): TaxRole {
  if (kind === "vat") return isSale ? "output_vat" : "input_vat";
  return isSale ? "cwt_receivable" : "ewt_payable";
}

export interface TaxLineInput {
  account_id: number | null;
  /** cents */
  debit: number;
  credit: number;
  vat_code_id: number | null;
  ewt_code_id: number | null;
}

export interface TaxCheck {
  role: TaxRole;
  /** Signed cents, debit positive. */
  expected: number;
  actual: number;
  ok: boolean;
}

/** Expected vs actual tax per role for an entry, mirroring the API's posting check. */
export function checkTax(lines: TaxLineInput[], accounts: Account[], codes: TaxCode[]): TaxCheck[] {
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const codeById = new Map(codes.map((c) => [c.id, c]));
  const expected = new Map<TaxRole, number>();

  for (const l of lines) {
    const account = l.account_id ? byId.get(l.account_id) : undefined;
    if (!account || account.tax_role) continue;
    const base = l.debit || l.credit;
    if (!base) continue;
    for (const id of [l.vat_code_id, l.ewt_code_id]) {
      const code = id ? codeById.get(id) : undefined;
      if (!code || code.rate_bp === 0) continue;
      const baseIsDebit = l.debit > 0;
      const taxIsDebit = code.kind === "vat" ? baseIsDebit : !baseIsDebit;
      const role = taxTarget(code.kind, account.type === "revenue");
      const tax = taxOn(base, code.rate_bp);
      expected.set(role, (expected.get(role) ?? 0) + (taxIsDebit ? tax : -tax));
    }
  }

  return Array.from(expected.entries()).map(([role, exp]) => {
    const actual = lines.reduce((sum, l) => {
      const a = l.account_id ? byId.get(l.account_id) : undefined;
      return a?.tax_role === role ? sum + l.debit - l.credit : sum;
    }, 0);
    return { role, expected: exp, actual, ok: Math.abs(actual - exp) <= TAX_TOLERANCE };
  });
}

export interface TaxLineFix {
  role: TaxRole;
  account: Account | null;
  /** Cents to add on the given side. */
  debit: number;
  credit: number;
}

/** Lines that would bring each role to its expected amount; account is null if none is tagged with the role. */
export function taxFixes(checks: TaxCheck[], accounts: Account[]): TaxLineFix[] {
  return checks.filter((c) => !c.ok).map((c) => {
    const diff = c.expected - c.actual;
    const account = accounts.find((a) => a.tax_role === c.role && a.is_active) ?? null;
    return { role: c.role, account, debit: diff > 0 ? diff : 0, credit: diff < 0 ? -diff : 0 };
  });
}
