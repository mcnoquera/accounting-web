"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { createTaxCode, updateTaxCode } from "@/app/actions/tax-codes";
import { initialActionState } from "@/lib/action-state";
import type { TaxCode, TaxKind } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function CreateTaxCodeForm() {
  const [state, action] = useFormState(createTaxCode, initialActionState);
  const [kind, setKind] = useState<TaxKind>("ewt");
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      {state.message && <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>}
      <div className="grid gap-3 sm:grid-cols-[120px_1fr_120px_100px_150px]">
        <div className="space-y-1">
          <Label htmlFor="tc-code">Code</Label>
          <Input id="tc-code" name="code" required maxLength={20} placeholder="WC120" className="font-mono uppercase" aria-invalid={!!state.errors?.code} />
          <FieldError messages={state.errors?.code} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="tc-name">Name</Label>
          <Input id="tc-name" name="name" required placeholder="EWT 2% - contractors" aria-invalid={!!state.errors?.name} />
          <FieldError messages={state.errors?.name} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="tc-kind">Kind</Label>
          <Select id="tc-kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value as TaxKind)}>
            <option value="ewt">Withholding</option>
            <option value="vat">VAT</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="tc-rate">Rate %</Label>
          <Input id="tc-rate" name="rate" required inputMode="decimal" placeholder="2" className="text-right font-mono" aria-invalid={!!state.errors?.rate} />
          <FieldError messages={state.errors?.rate} />
        </div>
        {kind === "vat" && (
          <div className="space-y-1">
            <Label htmlFor="tc-cat">VAT category</Label>
            <Select id="tc-cat" name="vat_category" required defaultValue="vatable" aria-invalid={!!state.errors?.vat_category}>
              <option value="vatable">Vatable</option>
              <option value="zero_rated">Zero-rated</option>
              <option value="exempt">Exempt</option>
            </Select>
            <FieldError messages={state.errors?.vat_category} />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <input type="hidden" name="is_active" value="on" />
        <p className="text-xs text-muted-foreground">Confirm codes and rates with your accountant. A code&apos;s rate can&apos;t change once it&apos;s used on an entry.</p>
        <SubmitButton>Add tax code</SubmitButton>
      </div>
    </form>
  );
}

export function EditTaxCodeForm({ code }: { code: TaxCode }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(updateTaxCode.bind(null, code.id), initialActionState);
  const used = (code.lines_count ?? 0) > 0;

  useEffect(() => { if (state.ok) setOpen(false); }, [state]);

  if (!open) return <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>Edit</Button>;

  return (
    <form action={action} className="ml-auto max-w-sm space-y-2 text-left">
      {state.message && !state.ok && <Alert>{state.message}</Alert>}
      <div className="space-y-1">
        <Label htmlFor={`tc-name-${code.id}`}>Name</Label>
        <Input id={`tc-name-${code.id}`} name="name" required defaultValue={code.name} />
        <FieldError messages={state.errors?.name} />
      </div>
      {!used && (
        <div className="space-y-1">
          <Label htmlFor={`tc-rate-${code.id}`}>Rate %</Label>
          <Input id={`tc-rate-${code.id}`} name="rate" required defaultValue={code.rate} className="text-right font-mono" />
          <FieldError messages={state.errors?.rate} />
        </div>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={code.is_active} className="h-4 w-4" /> Active
      </label>
      {used && <p className="text-xs text-muted-foreground">Used on {code.lines_count} line{code.lines_count === 1 ? "" : "s"}, so the rate is locked. Deactivate it and add a new code to change the rate.</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <SubmitButton size="sm">Save</SubmitButton>
      </div>
    </form>
  );
}
