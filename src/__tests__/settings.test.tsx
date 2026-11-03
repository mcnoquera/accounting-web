import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReversalTag } from "@/components/features/badges";
import { CompanyForm } from "@/components/features/settings/company-form";
import { UserControls, UserStatus } from "@/components/features/settings/user-forms";
import type { User } from "@/types";

// Next bundles a React with useFormState/useFormStatus; plain react-dom 18 in Vitest doesn't.
vi.mock("react-dom", async (orig) => ({
  ...(await orig<typeof import("react-dom")>()),
  useFormState: (_action: unknown, initial: unknown) => [initial, vi.fn()],
  useFormStatus: () => ({ pending: false }),
}));
vi.mock("@/app/actions/users", () => ({ createUser: vi.fn(), changeRole: vi.fn(), setActive: vi.fn(), unlockUser: vi.fn() }));
vi.mock("@/app/actions/company", () => ({ saveCompany: vi.fn() }));


const user = (extra: Partial<User> = {}): User => ({ id: 2, name: "Bea", email: "bea@test.com", role: "accountant", is_active: true, is_locked: false, ...extra });

describe("ReversalTag", () => {
  it("labels both sides of a reversal pair", () => {
    const { rerender, container } = render(<ReversalTag entry={{ reversal_of_id: 4 }} />);
    expect(screen.getByText("reversal")).toBeInTheDocument();
    rerender(<ReversalTag entry={{ reversal_of_id: null, reversed_by: { number: "JE-000009" } }} />);
    expect(screen.getByText("reversed")).toBeInTheDocument();
    rerender(<ReversalTag entry={{ reversal_of_id: null, reversed_by: null }} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("UserStatus", () => {
  it("prefers inactive over locked", () => {
    render(<UserStatus user={user({ is_active: false, is_locked: true })} />);
    expect(screen.getByText("inactive")).toBeInTheDocument();
  });

  it("shows locked accounts", () => {
    render(<UserStatus user={user({ is_locked: true })} />);
    expect(screen.getByText("locked")).toHaveClass("text-warning");
  });
});

describe("UserControls", () => {
  it("hides deactivate on your own row and offers unlock when locked", () => {
    const { rerender } = render(<UserControls user={user()} isMe />);
    expect(screen.queryByRole("button", { name: "Deactivate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Unlock" })).not.toBeInTheDocument();

    rerender(<UserControls user={user({ is_locked: true })} isMe={false} />);
    expect(screen.getByRole("button", { name: "Deactivate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unlock" })).toBeInTheDocument();
  });

  it("offers reactivate for inactive users", () => {
    render(<UserControls user={user({ is_active: false })} isMe={false} />);
    expect(screen.getByRole("button", { name: "Reactivate" })).toBeInTheDocument();
  });
});

describe("CompanyForm", () => {
  it("formats the TIN and flags an incomplete one", async () => {
    render(<CompanyForm company={null} />);
    const tin = screen.getByLabelText("TIN");
    await userEvent.type(tin, "12345678");
    expect(tin).toHaveValue("123-456-78");
    expect(tin).toHaveAttribute("aria-invalid", "true");
    await userEvent.type(tin, "9000");
    expect(tin).toHaveValue("123-456-789-000");
    expect(tin).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByRole("button", { name: "Finish setup" })).toBeInTheDocument();
  });

  it("is read-only for non-admins", () => {
    render(<CompanyForm readOnly company={{ id: 1, name: "Acme", trade_name: null, tin: "123-456-789-000", rdo_code: "044", address: "Taguig", zip_code: null, vat_registered: true, currency: "PHP", fiscal_year_start_month: 1 }} />);
    expect(screen.getByLabelText("Registered name")).toBeDisabled();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
