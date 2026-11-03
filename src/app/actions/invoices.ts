"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { ActionState } from "@/lib/action-state";
import type { SalesInvoice } from "@/types";

function fail(e: unknown): ActionState {
  if (e instanceof ApiError) return { message: e.message, errors: e.errors };
  throw e;
}

/** Saves a draft; with intent=issue it issues it straight away. */
export async function saveInvoice(id: number | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  let saved: SalesInvoice;
  try {
    const body = JSON.parse(String(form.get("payload") ?? "{}"));
    saved = (await api<SalesInvoice>(id ? `/sales-invoices/${id}` : "/sales-invoices", { method: id ? "PUT" : "POST", body })).data;
  } catch (e) {
    return fail(e);
  }
  if (form.get("intent") === "issue") {
    try {
      await api(`/sales-invoices/${saved.id}/issue`, { method: "POST" });
    } catch (e) {
      revalidatePath("/invoices");
      // The draft is saved; show why issuing failed on its page.
      redirect(`/invoices/${saved.id}?issue_error=${encodeURIComponent(e instanceof ApiError ? e.message : "Issue failed")}`);
    }
  }
  revalidatePath("/invoices");
  redirect(`/invoices/${saved.id}${form.get("intent") === "issue" ? "?done=issued" : ""}`);
}

export async function issueInvoice(id: number, _prev: ActionState, _form: FormData): Promise<ActionState> {
  try {
    await api(`/sales-invoices/${id}/issue`, { method: "POST" });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/invoices");
  redirect(`/invoices/${id}?done=issued`);
}

export async function voidInvoice(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await api(`/sales-invoices/${id}/void`, { method: "POST", body: { reason: form.get("reason") } });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/invoices");
  redirect(`/invoices/${id}?done=voided`);
}

export async function deleteInvoice(id: number, _prev: ActionState, _form: FormData): Promise<ActionState> {
  try {
    await api(`/sales-invoices/${id}`, { method: "DELETE" });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/invoices");
  redirect("/invoices");
}
