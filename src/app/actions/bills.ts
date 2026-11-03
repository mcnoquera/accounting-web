"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { ActionState } from "@/lib/action-state";
import type { PurchaseBill } from "@/types";

function fail(e: unknown): ActionState {
  if (e instanceof ApiError) return { message: e.message, errors: e.errors };
  throw e;
}

/** Saves a draft; with intent=record it records it straight away. */
export async function saveBill(id: number | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  let saved: PurchaseBill;
  try {
    const body = JSON.parse(String(form.get("payload") ?? "{}"));
    saved = (await api<PurchaseBill>(id ? `/purchase-bills/${id}` : "/purchase-bills", { method: id ? "PUT" : "POST", body })).data;
  } catch (e) {
    return fail(e);
  }
  if (form.get("intent") === "record") {
    try {
      await api(`/purchase-bills/${saved.id}/record`, { method: "POST" });
    } catch (e) {
      revalidatePath("/bills");
      // The draft is saved; show why issuing failed on its page.
      redirect(`/bills/${saved.id}?record_error=${encodeURIComponent(e instanceof ApiError ? e.message : "Record failed")}`);
    }
  }
  revalidatePath("/bills");
  redirect(`/bills/${saved.id}${form.get("intent") === "record" ? "?done=recorded" : ""}`);
}

export async function recordBill(id: number, _prev: ActionState, _form: FormData): Promise<ActionState> {
  try {
    await api(`/purchase-bills/${id}/record`, { method: "POST" });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/bills");
  redirect(`/bills/${id}?done=recorded`);
}

export async function voidBill(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await api(`/purchase-bills/${id}/void`, { method: "POST", body: { reason: form.get("reason") } });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/bills");
  redirect(`/bills/${id}?done=voided`);
}

export async function deleteBill(id: number, _prev: ActionState, _form: FormData): Promise<ActionState> {
  try {
    await api(`/purchase-bills/${id}`, { method: "DELETE" });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/bills");
  redirect("/bills");
}
