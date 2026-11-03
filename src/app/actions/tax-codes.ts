"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api/client";
import type { ActionState } from "@/lib/action-state";

function body(form: FormData, withKind: boolean) {
  const kind = String(form.get("kind") ?? "");
  return {
    ...(withKind ? { code: String(form.get("code") ?? "").trim().toUpperCase(), kind, vat_category: kind === "vat" ? form.get("vat_category") || null : null } : {}),
    name: String(form.get("name") ?? "").trim(),
    ...(form.has("rate") ? { rate: String(form.get("rate") ?? "").trim() } : {}),
    is_active: form.get("is_active") === "on",
  };
}

async function run(call: () => Promise<unknown>, message: string): Promise<ActionState> {
  try {
    await call();
  } catch (e) {
    if (e instanceof ApiError) return { message: e.message, errors: e.errors };
    throw e;
  }
  revalidatePath("/settings/tax-codes");
  return { ok: true, message };
}

export async function createTaxCode(_prev: ActionState, form: FormData): Promise<ActionState> {
  return run(() => api("/tax-codes", { method: "POST", body: body(form, true) }), "Tax code added.");
}

/** Used codes can't change their rate; the form omits the rate field for them. */
export async function updateTaxCode(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  return run(() => api(`/tax-codes/${id}`, { method: "PUT", body: body(form, false) }), "Tax code saved.");
}
