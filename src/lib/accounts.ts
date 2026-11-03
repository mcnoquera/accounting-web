import type { Account } from "@/types";

export interface AccountTreeRow {
  account: Account;
  depth: number;
  isGroup: boolean;
}

/** Ids of accounts that have sub-accounts. Entries can't post to these. */
export function groupIds(accounts: Account[]): Set<number> {
  return new Set(accounts.map((a) => a.parent_id).filter((id): id is number => id !== null));
}

/**
 * Orders accounts as a tree: each parent followed by its children (by code), with depth.
 * Accounts whose parent isn't in the list are treated as roots, so filtered lists still render.
 */
export function buildAccountTree(accounts: Account[]): AccountTreeRow[] {
  const byCode = (a: Account, b: Account) => a.code.localeCompare(b.code, undefined, { numeric: true });
  const ids = new Set(accounts.map((a) => a.id));
  const groups = groupIds(accounts);
  const children = new Map<number | null, Account[]>();
  for (const a of accounts) {
    const key = a.parent_id !== null && ids.has(a.parent_id) ? a.parent_id : null;
    children.set(key, [...(children.get(key) ?? []), a]);
  }

  const rows: AccountTreeRow[] = [];
  const seen = new Set<number>();
  const walk = (parent: number | null, depth: number) => {
    for (const a of (children.get(parent) ?? []).sort(byCode)) {
      if (seen.has(a.id)) continue; // defensive: never loop on bad data
      seen.add(a.id);
      rows.push({ account: a, depth, isGroup: groups.has(a.id) });
      walk(a.id, depth + 1);
    }
  };
  walk(null, 0);
  return rows;
}

/** Accounts a journal line can use: active detail accounts, plus any already on the entry. */
export function postingAccounts(accounts: Account[], keepIds: number[] = []): Account[] {
  const groups = groupIds(accounts);
  return accounts.filter((a) => keepIds.includes(a.id) || (a.is_active && !groups.has(a.id)));
}

/** Accounts that may be chosen as the parent of `account` (same type, not itself or a descendant). */
export function parentOptions(accounts: Account[], type: Account["type"], account?: Account): Account[] {
  const excluded = new Set<number>();
  if (account) {
    excluded.add(account.id);
    let grew = true;
    while (grew) {
      grew = false;
      for (const a of accounts) {
        if (a.parent_id !== null && excluded.has(a.parent_id) && !excluded.has(a.id)) {
          excluded.add(a.id);
          grew = true;
        }
      }
    }
  }
  return accounts.filter((a) => a.type === type && !excluded.has(a.id)).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
}

/** Formats a BIR TIN as you type: 123-456-789-000 (or a 5-digit branch). */
export function formatTin(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9), d.slice(9)].filter(Boolean).join("-");
}

export function isValidTin(value: string): boolean {
  return [9, 12, 14].includes(value.replace(/\D/g, "").length) && /^[\d\s-]+$/.test(value);
}
