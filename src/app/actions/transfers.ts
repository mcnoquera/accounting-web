"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { ActionState } from "@/lib/action-state";
import type { JournalEntry } from "@/types";

export async function recordTransfer(_prev: ActionState, form: FormData): Promise<ActionState> {
  let entry: JournalEntry;
  const text = (k: string) => String(form.get(k) ?? "").trim() || null;
  try {
    entry = (await api<JournalEntry>("/transfers", {
      method: "POST",
      body: {
        date: form.get("date"), from_account_id: Number(form.get("from_account_id")), to_account_id: Number(form.get("to_account_id")),
        amount: text("amount")?.replace(/,/g, ""), fee: text("fee")?.replace(/,/g, "") ?? null,
        fee_account_id: form.get("fee_account_id") ? Number(form.get("fee_account_id")) : null, reference: text("reference"),
      },
    })).data;
  } catch (e) {
    if (e instanceof ApiError) return { message: e.message, errors: e.errors };
    throw e;
  }
  revalidatePath("/");
  redirect(`/journal/${entry.id}?done=posted`);
}
