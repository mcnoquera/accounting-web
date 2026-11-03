"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { createContact, deleteContact, updateContact } from "@/app/actions/contacts";
import { initialActionState } from "@/lib/action-state";
import { CONTACT_TYPE_LABEL } from "@/lib/contacts";
import type { Contact, ContactType } from "@/types";
import { Alert } from "@/components/ui/alert";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function ContactForm({ contact }: { contact?: Contact }) {
  const [state, action] = useFormState(contact ? updateContact.bind(null, contact.id) : createContact, initialActionState);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok && !contact) ref.current?.reset(); }, [state, contact]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      {state.message && <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>}
      <div className="grid gap-3 sm:grid-cols-[1fr_190px_170px_110px]">
        <div className="space-y-1">
          <Label htmlFor="c-name">Name</Label>
          <Input id="c-name" name="name" required maxLength={255} defaultValue={contact?.name} placeholder="Registered name" aria-invalid={!!state.errors?.name} />
          <FieldError messages={state.errors?.name} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-type">Type</Label>
          <Select id="c-type" name="type" defaultValue={contact?.type ?? "customer"}>
            {(Object.keys(CONTACT_TYPE_LABEL) as ContactType[]).map((t) => <option key={t} value={t}>{CONTACT_TYPE_LABEL[t]}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-tin">TIN <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="c-tin" name="tin" defaultValue={contact?.tin ?? ""} placeholder="123-456-789-000" className="font-mono" aria-invalid={!!state.errors?.tin} />
          <FieldError messages={state.errors?.tin} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-terms">Terms (days)</Label>
          <Input id="c-terms" name="payment_terms_days" type="number" min={0} max={365} defaultValue={contact?.payment_terms_days ?? 30} className="text-right" aria-invalid={!!state.errors?.payment_terms_days} />
          <FieldError messages={state.errors?.payment_terms_days} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_220px_160px]">
        <div className="space-y-1">
          <Label htmlFor="c-address">Address <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="c-address" name="address" maxLength={500} defaultValue={contact?.address ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-email">Email <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="c-email" name="email" type="email" defaultValue={contact?.email ?? ""} aria-invalid={!!state.errors?.email} />
          <FieldError messages={state.errors?.email} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-phone">Phone <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="c-phone" name="phone" maxLength={50} defaultValue={contact?.phone ?? ""} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={contact?.is_active ?? true} className="h-4 w-4" /> Active (can be used on new entries)
        </label>
        <SubmitButton>{contact ? "Save changes" : "Add contact"}</SubmitButton>
      </div>
    </form>
  );
}

export function DeleteContact({ contact }: { contact: Contact }) {
  const [state, action] = useFormState(deleteContact.bind(null, contact.id), initialActionState);
  return (
    <form action={action} className="space-y-2" onSubmit={(e) => { if (!confirm(`Delete ${contact.name}?`)) e.preventDefault(); }}>
      {state.message && !state.ok && <Alert>{state.message}</Alert>}
      <SubmitButton variant="ghost" className="text-destructive" pendingText="Deleting…">Delete contact</SubmitButton>
    </form>
  );
}
