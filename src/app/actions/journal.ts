"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { ActionState } from "@/lib/action-state";
import type { JournalEntry } from "@/types";

function fail(e: unknown): ActionState {
  if (e instanceof ApiError) return { message: e.message, errors: e.errors };
  throw e;
}

/** `entryId` is null for a new draft. The form posts its lines as a JSON payload. */
export async function saveEntry(entryId: number | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  let saved: JournalEntry;
  try {
    const body = JSON.parse(String(form.get("payload") ?? "{}"));
    const res = await api<JournalEntry>(entryId ? `/journal-entries/${entryId}` : "/journal-entries", {
      method: entryId ? "PUT" : "POST",
      body,
    });
    saved = res.data;
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/journal");
  redirect(`/journal/${saved.id}${form.get("intent") === "post" ? "?post=1" : ""}`);
}

export async function postEntry(id: number, _prev: ActionState, _form: FormData): Promise<ActionState> {
  try {
    await api(`/journal-entries/${id}/post`, { method: "POST" });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/journal");
  redirect(`/journal/${id}?done=posted`);
}

export async function voidEntry(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await api(`/journal-entries/${id}/void`, { method: "POST", body: { reason: form.get("reason") } });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/journal");
  redirect(`/journal/${id}?done=voided`);
}

export async function deleteEntry(id: number, _prev: ActionState, _form: FormData): Promise<ActionState> {
  try {
    await api(`/journal-entries/${id}`, { method: "DELETE" });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/journal");
  redirect("/journal");
}
