"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { ActionState } from "@/lib/action-state";

function body(form: FormData) {
  const text = (k: string) => String(form.get(k) ?? "").trim() || null;
  return {
    name: String(form.get("name") ?? "").trim(),
    type: form.get("type"),
    tin: text("tin"),
    address: text("address"),
    email: text("email"),
    phone: text("phone"),
    payment_terms_days: Number(form.get("payment_terms_days") || 30),
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
  revalidatePath("/contacts", "layout");
  return { ok: true, message };
}

export async function createContact(_prev: ActionState, form: FormData): Promise<ActionState> {
  return run(() => api("/contacts", { method: "POST", body: body(form) }), "Contact added.");
}

export async function updateContact(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  return run(() => api(`/contacts/${id}`, { method: "PUT", body: body(form) }), "Contact saved.");
}

export async function deleteContact(id: number, _prev: ActionState, _form: FormData): Promise<ActionState> {
  const state = await run(() => api(`/contacts/${id}`, { method: "DELETE" }), "Contact deleted.");
  if (state.ok) redirect("/contacts");
  return state;
}
