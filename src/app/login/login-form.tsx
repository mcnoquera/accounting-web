"use client";

import { useFormState } from "react-dom";
import { login } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";
import { Alert } from "@/components/ui/alert";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm({ next, expired }: { next?: string; expired?: boolean }) {
  const [state, action] = useFormState(login, initialActionState);

  return (
    <form action={action} className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
      {expired && !state.message && <Alert tone="info">Your session expired. Please sign in again.</Alert>}
      {state.message && <Alert>{state.message}</Alert>}
      <input type="hidden" name="next" value={next ?? "/"} />
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required defaultValue="accountant@example.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <SubmitButton className="w-full" pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
