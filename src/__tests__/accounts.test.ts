import { describe, expect, it } from "vitest";
import { buildAccountTree, formatTin, groupIds, isValidTin, parentOptions, postingAccounts } from "@/lib/accounts";
import type { Account } from "@/types";

const acc = (id: number, code: string, parent_id: number | null = null, extra: Partial<Account> = {}): Account => ({
  id, code, name: `Account ${code}`, type: "asset", parent_id, normal_balance: "debit", description: null, is_active: true, ...extra,
});

const chart = [
  acc(3, "1130", 1),
  acc(1, "1100"),
  acc(2, "1110", 1),
  acc(4, "1200"),
  acc(5, "1210", 4),
  acc(6, "1211", 5),
  acc(7, "2110", null, { type: "liability", normal_balance: "credit" }),
];

describe("buildAccountTree", () => {
  it("orders parents before children with depth", () => {
    const rows = buildAccountTree(chart);
    expect(rows.map((r) => [r.account.code, r.depth, r.isGroup])).toEqual([
      ["1100", 0, true],
      ["1110", 1, false],
      ["1130", 1, false],
      ["1200", 0, true],
      ["1210", 1, true],
      ["1211", 2, false],
      ["2110", 0, false],
    ]);
  });

  it("treats accounts with a missing parent as roots", () => {
    expect(buildAccountTree([acc(2, "1110", 99)])).toEqual([{ account: expect.objectContaining({ id: 2 }), depth: 0, isGroup: false }]);
  });

  it("sorts codes numerically", () => {
    expect(buildAccountTree([acc(1, "10"), acc(2, "9")]).map((r) => r.account.code)).toEqual(["9", "10"]);
  });
});

describe("postingAccounts", () => {
  it("excludes group and inactive accounts but keeps ones already on the entry", () => {
    const list = [...chart, acc(8, "1300", null, { is_active: false })];
    expect(groupIds(list)).toEqual(new Set([1, 4, 5]));
    expect(postingAccounts(list).map((a) => a.code)).toEqual(["1130", "1110", "1211", "2110"]);
    expect(postingAccounts(list, [8]).map((a) => a.code)).toContain("1300");
  });
});

describe("parentOptions", () => {
  it("offers same-type accounts except the account and its descendants", () => {
    const self = chart.find((a) => a.id === 4)!;
    expect(parentOptions(chart, "asset", self).map((a) => a.code)).toEqual(["1100", "1110", "1130"]);
    expect(parentOptions(chart, "liability").map((a) => a.code)).toEqual(["2110"]);
  });
});

describe("TIN helpers", () => {
  it("formats as you type", () => {
    expect(formatTin("123456789000")).toBe("123-456-789-000");
    expect(formatTin("1234")).toBe("123-4");
    expect(formatTin("123-456-789-00001-99")).toBe("123-456-789-00001");
  });

  it("validates 9, 12 or 14 digits", () => {
    expect(isValidTin("123-456-789")).toBe(true);
    expect(isValidTin("123-456-789-000")).toBe(true);
    expect(isValidTin("123-456-789-00001")).toBe(true);
    expect(isValidTin("123-456-78")).toBe(false);
    expect(isValidTin("123-ABC-789")).toBe(false);
  });
});
