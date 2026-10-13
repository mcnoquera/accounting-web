"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { raiseFinding, resolveFinding } from "@/app/actions/audit";
import { initialActionState } from "@/lib/action-state";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function RaiseFindingForm({ entryId }: { entryId?: string }) {
  const [state, action] = useFormState(raiseFinding, initialActionState);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      {state.message && <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>}
      <div className="grid gap-3 sm:grid-cols-[1fr_140px_140px]">
        <div className="space-y-1">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required aria-invalid={!!state.errors?.title} placeholder="Short summary of the issue" />
          <FieldError messages={state.errors?.title} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="severity">Severity</Label>
          <Select id="severity" name="severity" defaultValue="medium">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="journal_entry_id">Entry ID</Label>
          <Input id="journal_entry_id" name="journal_entry_id" inputMode="numeric" defaultValue={entryId} placeholder="optional" aria-invalid={!!state.errors?.journal_entry_id} />
          <FieldError messages={state.errors?.journal_entry_id} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required aria-invalid={!!state.errors?.description} placeholder="What did you find, why does it matter, and what evidence do you need?" />
        <FieldError messages={state.errors?.description} />
      </div>
      <div className="flex justify-end"><SubmitButton>Raise finding</SubmitButton></div>
    </form>
  );
}

export function ResolveFindingForm({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(resolveFinding.bind(null, id), initialActionState);

  if (!open) return <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Resolve</Button>;
  return (
    <form action={action} className="mt-3 space-y-2">
      {state.message && !state.ok && <Alert>{state.message}</Alert>}
      <Textarea name="resolution" required minLength={5} placeholder="How was this addressed?" aria-label="Resolution" aria-invalid={!!state.errors?.resolution} />
      <FieldError messages={state.errors?.resolution} />
      <div className="flex gap-2">
        <SubmitButton size="sm" pendingText="Resolving…">Mark resolved</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
