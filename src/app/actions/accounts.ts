"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { ActionState } from "@/lib/action-state";

function payload(form: FormData) {
  return {
    code: String(form.get("code") ?? "").trim(),
    name: String(form.get("name") ?? "").trim(),
    type: String(form.get("type") ?? ""),
    parent_id: form.get("parent_id") ? Number(form.get("parent_id")) : null,
    tax_role: form.get("tax_role") || null,
    control_type: form.get("control_type") || null,
    is_cash: form.get("is_cash") === "on",
    description: String(form.get("description") ?? "").trim() || null,
    is_active: form.get("is_active") === "on",
  };
}

function fail(e: unknown): ActionState {
  if (e instanceof ApiError) return { message: e.message, errors: e.errors };
  throw e;
}

export async function createAccount(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await api("/accounts", { method: "POST", body: payload(form) });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/accounts");
  return { ok: true, message: "Account created." };
}

export async function updateAccount(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await api(`/accounts/${id}`, { method: "PUT", body: payload(form) });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/accounts");
  revalidatePath(`/accounts/${id}`);
  return { ok: true, message: "Account updated." };
}

export async function deleteAccount(id: number, _prev: ActionState, _form: FormData): Promise<ActionState> {
  try {
    await api(`/accounts/${id}`, { method: "DELETE" });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/accounts");
  return { ok: true, message: "Account deleted." };
}

export async function loadDefaultAccounts(_prev: ActionState, _form: FormData): Promise<ActionState> {
  try {
    await api("/accounts/load-defaults", { method: "POST" });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/accounts");
  // The load-defaults card disappears once the chart has accounts, so confirm on the page itself.
  redirect("/accounts?loaded=1");
}
