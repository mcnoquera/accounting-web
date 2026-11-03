"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { ActionState } from "@/lib/action-state";
import type { Payment } from "@/types";

function fail(e: unknown): ActionState {
  if (e instanceof ApiError) return { message: e.message, errors: e.errors };
  throw e;
}

function revalidate() {
  for (const p of ["/payments", "/invoices", "/bills", "/reports/aging"]) revalidatePath(p);
}

export async function recordPayment(_prev: ActionState, form: FormData): Promise<ActionState> {
  let saved: Payment;
  try {
    saved = (await api<Payment>("/payments", { method: "POST", body: JSON.parse(String(form.get("payload") ?? "{}")) })).data;
  } catch (e) {
    return fail(e);
  }
  revalidate();
  redirect(`/payments/${saved.id}?done=recorded`);
}

export async function allocatePayment(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await api(`/payments/${id}/allocate`, { method: "POST", body: JSON.parse(String(form.get("payload") ?? "{}")) });
  } catch (e) {
    return fail(e);
  }
  revalidate();
  redirect(`/payments/${id}?done=allocated`);
}

export async function voidPayment(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await api(`/payments/${id}/void`, { method: "POST", body: { reason: form.get("reason") } });
  } catch (e) {
    return fail(e);
  }
  revalidate();
  redirect(`/payments/${id}?done=voided`);
}
