import type { AccountingPeriod } from "@/types";

/** "2026-10" → "October 2026" */
export function periodLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Confirmation text for closing; drafts don't block a close but are worth a warning. */
export function closeConfirmText(p: Pick<AccountingPeriod, "period" | "draft_count">): string {
  const label = periodLabel(p.period);
  const drafts = p.draft_count > 0
    ? `\n\n${p.draft_count} draft entr${p.draft_count === 1 ? "y is" : "ies are"} still dated in ${label}. They can't be posted after closing unless moved to an open date.`
    : "";
  return `Close ${label}? Entries dated in it can no longer be created, posted or voided.${drafts}`;
}
