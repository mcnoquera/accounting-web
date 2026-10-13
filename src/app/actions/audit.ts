"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api/client";
import type { ActionState } from "@/lib/action-state";

function fail(e: unknown): ActionState {
  if (e instanceof ApiError) return { message: e.message, errors: e.errors };
  throw e;
}

export async function raiseFinding(_prev: ActionState, form: FormData): Promise<ActionState> {
  const entry = String(form.get("journal_entry_id") ?? "").trim();
  try {
    await api("/audit/findings", {
      method: "POST",
      body: {
        title: form.get("title"),
        description: form.get("description"),
        severity: form.get("severity"),
        journal_entry_id: entry ? Number(entry) : null,
      },
    });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/audit/findings");
  return { ok: true, message: "Finding raised." };
}

export async function resolveFinding(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await api(`/audit/findings/${id}/resolve`, { method: "POST", body: { resolution: form.get("resolution") } });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/audit/findings");
  return { ok: true, message: "Finding resolved." };
}
