"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { deleteEntry, postEntry, reverseEntry, voidEntry } from "@/app/actions/journal";
import { today } from "@/lib/dates";
import { initialActionState } from "@/lib/action-state";
import type { JournalEntry, User } from "@/types";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function DraftActions({ entry, me, highlight, locked = false }: { entry: JournalEntry; me: User; highlight?: boolean; locked?: boolean }) {
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
          <form action={post}><SubmitButton pendingText="Posting…" disabled={locked} title={locked ? "Dated in a closed period" : undefined}>Post to ledger</SubmitButton></form>
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
          <p className="text-sm text-muted-foreground">Use void for an entry that should never have been posted. It stays in the audit trail but disappears from the ledger and every report, including past periods.</p>
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

/** The earliest allowed reversal date: on or after the original and in an open period. */
export function reversalDates(entryDate: string, firstOpenDate: string | null, now: string = today()) {
  const min = firstOpenDate && firstOpenDate > entryDate ? firstOpenDate : entryDate;
  return { min, defaultDate: now < min ? min : now };
}

export function ReverseAction({ entry, firstOpenDate = null }: { entry: JournalEntry; firstOpenDate?: string | null }) {
  const [state, action] = useFormState(reverseEntry.bind(null, entry.id), initialActionState);
  const { min: minDate, defaultDate } = reversalDates(entry.entry_date, firstOpenDate);
  return (
    <Card>
      <CardHeader><CardTitle>Reverse entry</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="space-y-3" onSubmit={(e) => { if (!confirm(`Post a reversing entry for ${entry.number}?`)) e.preventDefault(); }}>
          {state.message && <Alert>{state.message}</Alert>}
          <p className="text-sm text-muted-foreground">
            Posts a new entry that swaps every debit and credit. The original stays in the ledger, so past periods don’t change. Use this to correct an entry from a period you’ve already reported.
          </p>
          <div className="space-y-1">
            <Label htmlFor="reverse-date">Reversal date</Label>
            <Input id="reverse-date" type="date" name="entry_date" min={minDate} defaultValue={defaultDate} aria-invalid={!!state.errors?.entry_date} />
            <FieldError messages={state.errors?.entry_date} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reverse-reason">Reason</Label>
            <Input id="reverse-reason" name="reason" required minLength={5} maxLength={200} placeholder="e.g. Wrong expense account" aria-invalid={!!state.errors?.reason} />
            <FieldError messages={state.errors?.reason} />
          </div>
          <SubmitButton variant="outline" pendingText="Reversing…">Post reversing entry</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
