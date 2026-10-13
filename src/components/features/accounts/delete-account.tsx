"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { deleteAccount } from "@/app/actions/accounts";
import { initialActionState } from "@/lib/action-state";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

export function DeleteAccount({ id }: { id: number }) {
  const [state, action] = useFormState(deleteAccount.bind(null, id), initialActionState);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.push("/accounts");
  }, [state, router]);

  return (
    <form action={action} onSubmit={(e) => { if (!confirm("Delete this account? This cannot be undone.")) e.preventDefault(); }} className="space-y-2">
      {state.message && !state.ok && <Alert>{state.message}</Alert>}
      <SubmitButton variant="destructive" size="sm" pendingText="Deleting…">Delete account</SubmitButton>
    </form>
  );
}
