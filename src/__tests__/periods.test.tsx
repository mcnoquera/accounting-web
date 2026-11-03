import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { reversalDates } from "@/components/features/journal/entry-actions";
import { closeConfirmText, periodLabel } from "@/lib/periods";
import { ClosePeriodButton, PeriodStatusBadge, ReopenPeriodForm } from "@/components/features/settings/period-controls";
import type { AccountingPeriod } from "@/types";

vi.mock("react-dom", async (orig) => ({
  ...(await orig<typeof import("react-dom")>()),
  useFormState: (_action: unknown, initial: unknown) => [initial, vi.fn()],
  useFormStatus: () => ({ pending: false }),
}));
vi.mock("@/app/actions/periods", () => ({ closePeriod: vi.fn(), reopenPeriod: vi.fn() }));
vi.mock("@/app/actions/journal", () => ({ deleteEntry: vi.fn(), postEntry: vi.fn(), reverseEntry: vi.fn(), voidEntry: vi.fn() }));

const period = (extra: Partial<AccountingPeriod> = {}): AccountingPeriod => ({
  period: "2026-10", start_date: "2026-10-01", end_date: "2026-10-31", status: "open",
  closed_at: null, closed_by: null, reopened_at: null, reopened_by: null, reopen_reason: null,
  posted_count: 4, draft_count: 0, can_close: true, can_reopen: false, ...extra,
});

describe("periodLabel", () => {
  it("formats YYYY-MM as month and year", () => {
    expect(periodLabel("2026-10")).toBe("October 2026");
    expect(periodLabel("2027-01")).toBe("January 2027");
  });
});

describe("closeConfirmText", () => {
  it("warns about drafts left in the month", () => {
    expect(closeConfirmText({ period: "2026-10", draft_count: 0 })).not.toMatch(/draft/);
    expect(closeConfirmText({ period: "2026-10", draft_count: 1 })).toMatch(/1 draft entry is still dated in October 2026/);
    expect(closeConfirmText({ period: "2026-10", draft_count: 3 })).toMatch(/3 draft entries are still dated/);
  });
});

describe("reversalDates", () => {
  it("never allows a date before the original entry or inside a closed period", () => {
    expect(reversalDates("2026-09-10", null, "2026-11-15")).toEqual({ min: "2026-09-10", defaultDate: "2026-11-15" });
    expect(reversalDates("2026-09-10", "2026-11-01", "2026-11-15")).toEqual({ min: "2026-11-01", defaultDate: "2026-11-15" });
    // Today is still in the closed month: default jumps to the first open date.
    expect(reversalDates("2026-09-10", "2026-11-01", "2026-10-31")).toEqual({ min: "2026-11-01", defaultDate: "2026-11-01" });
    // Original dated after the lock: it is the floor.
    expect(reversalDates("2026-11-20", "2026-11-01", "2026-11-15")).toEqual({ min: "2026-11-20", defaultDate: "2026-11-20" });
  });
});

describe("period controls", () => {
  it("shows status badges", () => {
    render(<><PeriodStatusBadge status="closed" /><PeriodStatusBadge status="open" /></>);
    expect(screen.getByText("closed")).toBeInTheDocument();
    expect(screen.getByText("open")).toHaveClass("text-success");
  });

  it("asks for confirmation before closing", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ClosePeriodButton period={period({ draft_count: 2 })} />);
    await userEvent.click(screen.getByRole("button", { name: "Close period" }));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("2 draft entries"));
    confirm.mockRestore();
  });

  it("requires a reason to reopen", async () => {
    render(<ReopenPeriodForm period={period({ status: "closed", can_close: false, can_reopen: true })} />);
    await userEvent.click(screen.getByRole("button", { name: "Reopen…" }));
    const reason = screen.getByLabelText("Reason for reopening October 2026");
    expect(reason).toBeRequired();
    expect(reason).toHaveAttribute("minLength", "5");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText(/Reason for reopening/)).not.toBeInTheDocument();
  });
});
