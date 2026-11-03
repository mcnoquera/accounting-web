"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { createAccount, updateAccount } from "@/app/actions/accounts";
import { initialActionState } from "@/lib/action-state";
import { parentOptions } from "@/lib/accounts";
import { ACCOUNT_TYPES, TAX_ROLES, type Account, type AccountType } from "@/types";
import { Alert } from "@/components/ui/alert";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function AccountForm({ account, accounts = [] }: { account?: Account; accounts?: Account[] }) {
  const action = account ? updateAccount.bind(null, account.id) : createAccount;
  const [state, formAction] = useFormState(action, initialActionState);
  const [type, setType] = useState<AccountType>(account?.type ?? "asset");
  const ref = useRef<HTMLFormElement>(null);
  const parents = parentOptions(accounts, type, account);

  useEffect(() => {
    if (state.ok && !account) {
      ref.current?.reset();
      setType("asset");
    }
  }, [state, account]);

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      {state.message && <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>}
      <div className="grid gap-3 sm:grid-cols-[120px_1fr_160px]">
        <div className="space-y-1">
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" required defaultValue={account?.code} aria-invalid={!!state.errors?.code} placeholder="1000" />
          <FieldError messages={state.errors?.code} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required defaultValue={account?.name} aria-invalid={!!state.errors?.name} placeholder="Cash" />
          <FieldError messages={state.errors?.name} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="type">Type</Label>
          <Select id="type" name="type" required value={type} onChange={(e) => setType(e.target.value as AccountType)} aria-invalid={!!state.errors?.type}>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">{t[0].toUpperCase() + t.slice(1)}</option>
            ))}
          </Select>
          <FieldError messages={state.errors?.type} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="parent_id">Group under <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Select id="parent_id" name="parent_id" key={type} defaultValue={account?.type === type ? (account?.parent_id ?? "") : ""} aria-invalid={!!state.errors?.parent_id}>
          <option value="">— Top level —</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
          ))}
        </Select>
        <FieldError messages={state.errors?.parent_id} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="tax_role">Tax role <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Select id="tax_role" name="tax_role" defaultValue={account?.tax_role ?? ""} aria-invalid={!!state.errors?.tax_role}>
          <option value="">— None —</option>
          {TAX_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </Select>
        <p className="text-xs text-muted-foreground">Tag the accounts that hold VAT and withholding tax, so entries can be checked against their tax codes.</p>
        <FieldError messages={state.errors?.tax_role} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Input id="description" name="description" defaultValue={account?.description ?? ""} />
      </div>
      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={account?.is_active ?? true} className="h-4 w-4 accent-[hsl(var(--primary))]" />
          Active (can be used on new postings)
        </label>
        <SubmitButton>{account ? "Save changes" : "Add account"}</SubmitButton>
      </div>
    </form>
  );
}
