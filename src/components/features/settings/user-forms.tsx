"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { changeRole, createUser, setActive, unlockUser } from "@/app/actions/users";
import { initialActionState } from "@/lib/action-state";
import { ROLES, type User } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

const roleLabel = (r: string) => r[0].toUpperCase() + r.slice(1);

export function CreateUserForm() {
  const [state, action] = useFormState(createUser, initialActionState);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      {state.message && <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="u-name">Name</Label>
          <Input id="u-name" name="name" required aria-invalid={!!state.errors?.name} />
          <FieldError messages={state.errors?.name} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="u-email">Email</Label>
          <Input id="u-email" name="email" type="email" required aria-invalid={!!state.errors?.email} />
          <FieldError messages={state.errors?.email} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="u-role">Role</Label>
          <Select id="u-role" name="role" defaultValue="accountant">
            {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </Select>
          <FieldError messages={state.errors?.role} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="u-password">Temporary password</Label>
          <Input id="u-password" name="password" type="password" required minLength={12} autoComplete="new-password" aria-invalid={!!state.errors?.password} />
          <FieldError messages={state.errors?.password} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">At least 12 characters. Users are never deleted; deactivate them instead.</p>
        <SubmitButton pendingText="Adding…">Add user</SubmitButton>
      </div>
    </form>
  );
}

/** Role picker, activate/deactivate and unlock controls for one user row. */
export function UserControls({ user, isMe }: { user: User; isMe: boolean }) {
  const [roleState, roleAction] = useFormState(changeRole.bind(null, user.id), initialActionState);
  const [activeState, activeAction] = useFormState(setActive.bind(null, user.id, !user.is_active), initialActionState);
  const [unlockState, unlockAction] = useFormState(unlockUser.bind(null, user.id), initialActionState);
  const error = [roleState, activeState, unlockState].find((s) => s.message && !s.ok)?.message;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <form action={roleAction} className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`role-${user.id}`}>Role for {user.name}</label>
          <Select id={`role-${user.id}`} name="role" defaultValue={user.role} className="h-8 w-32" key={user.role}>
            {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </Select>
          <SubmitButton size="sm" variant="outline" pendingText="…">Save role</SubmitButton>
        </form>
        {user.is_locked && (
          <form action={unlockAction}>
            <SubmitButton size="sm" variant="outline" pendingText="…">Unlock</SubmitButton>
          </form>
        )}
        {!isMe && (
          <form
            action={activeAction}
            onSubmit={(e) => { if (user.is_active && !confirm(`Deactivate ${user.name}? They will be signed out everywhere.`)) e.preventDefault(); }}
          >
            <SubmitButton size="sm" variant={user.is_active ? "ghost" : "secondary"} className={user.is_active ? "text-destructive" : undefined} pendingText="…">
              {user.is_active ? "Deactivate" : "Reactivate"}
            </SubmitButton>
          </form>
        )}
      </div>
      {error && <Alert>{error}</Alert>}
    </div>
  );
}

export function UserStatus({ user }: { user: User }) {
  if (!user.is_active) return <Badge>inactive</Badge>;
  if (user.is_locked) return <Badge tone="warning">locked</Badge>;
  return <Badge tone="success">active</Badge>;
}
