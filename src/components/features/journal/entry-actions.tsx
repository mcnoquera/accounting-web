"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { deleteEntry, postEntry, voidEntry } from "@/app/actions/journal";
import { initialActionState } from "@/lib/action-state";
import type { JournalEntry, User } from "@/types";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function DraftActions({ entry, me, highlight }: { entry: JournalEntry; me: User; highlight?: boolean }) {
  const [postState, post] = useFormState(postEntry.bind(null, entry.id), initialActionState);
  const [delState, del] = useFormState(deleteEntry.bind(null, entry.id), initialActionState);
  const selfPosting = entry.created_by === me.id;

  return (
    <Card className={highlight ? "ring-2 ring-primary" : undefined}>
      <CardHeader><CardTitle>Review &amp; post</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {postState.message && <Alert>{postState.message}</Alert>}
        {delState.message && <Alert>{delState.message}</Alert>}
        <p className="text-sm text-muted-foreground">Posting locks the entry and adds it to the ledger and reports.</p>
        {selfPosting && (
          <Alert tone="info">
            You prepared this entry. Posting it yourself will be flagged in the audit exceptions report (segregation of duties). Ideally a second accountant posts it.
          </Alert>
        )}
        <div className="flex flex-wrap gap-2">
          <form action={post}><SubmitButton pendingText="Posting…">Post to ledger</SubmitButton></form>
          <Link href={`/journal/${entry.id}/edit`} className={buttonClass("outline")}>Edit</Link>
          <form action={del} onSubmit={(e) => { if (!confirm(`Delete draft ${entry.number}?`)) e.preventDefault(); }}>
            <SubmitButton variant="ghost" className="text-destructive" pendingText="Deleting…">Delete draft</SubmitButton>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

export function VoidAction({ entry }: { entry: JournalEntry }) {
  const [state, action] = useFormState(voidEntry.bind(null, entry.id), initialActionState);
  return (
    <Card>
      <CardHeader><CardTitle>Void entry</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="space-y-3" onSubmit={(e) => { if (!confirm(`Void ${entry.number}? It will be removed from all reports.`)) e.preventDefault(); }}>
          {state.message && <Alert>{state.message}</Alert>}
          <p className="text-sm text-muted-foreground">Posted entries can’t be edited or deleted. Voiding keeps the record for the audit trail but removes it from the ledger.</p>
          <div className="space-y-1">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" name="reason" required minLength={5} placeholder="e.g. Duplicate of JE-000011" aria-invalid={!!state.errors?.reason} />
            <FieldError messages={state.errors?.reason} />
          </div>
          <SubmitButton variant="destructive" pendingText="Voiding…">Void entry</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
