import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SeverityBadge, StatusBadge } from "@/components/features/badges";
import { ChangeDiff } from "@/components/features/audit/change-diff";

describe("badges", () => {
  it("renders entry status text", () => {
    render(<StatusBadge status="posted" />);
    expect(screen.getByText("posted")).toHaveClass("text-success");
  });

  it("colors high severity as danger", () => {
    render(<SeverityBadge severity="high" />);
    expect(screen.getByText("high")).toHaveClass("text-destructive");
  });
});

describe("ChangeDiff", () => {
  it("shows old and new values for changed fields", () => {
    render(<ChangeDiff oldValues={{ status: "draft" }} newValues={{ status: "posted" }} />);
    expect(screen.getByText("status")).toBeInTheDocument();
    expect(screen.getByText("draft")).toHaveClass("line-through");
    expect(screen.getByText("posted")).toBeInTheDocument();
  });

  it("renders a dash when nothing changed", () => {
    render(<ChangeDiff oldValues={null} newValues={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
