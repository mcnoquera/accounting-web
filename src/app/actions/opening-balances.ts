"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { ActionState } from "@/lib/action-state";

export async function saveOpeningBalances(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await api("/opening-balances", { method: "PUT", body: JSON.parse(String(form.get("payload") ?? "{}")) });
  } catch (e) {
    if (e instanceof ApiError) return { message: e.message, errors: e.errors };
    throw e;
  }
  revalidatePath("/", "layout");
  redirect("/settings/opening-balances?done=saved");
}
