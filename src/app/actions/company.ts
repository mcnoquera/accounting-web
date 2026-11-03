"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api/client";
import type { ActionState } from "@/lib/action-state";

export async function saveCompany(_prev: ActionState, form: FormData): Promise<ActionState> {
  const text = (k: string) => String(form.get(k) ?? "").trim();
  try {
    await api("/company", {
      method: "PUT",
      body: {
        name: text("name"),
        trade_name: text("trade_name") || null,
        tin: text("tin"),
        rdo_code: text("rdo_code") || null,
        address: text("address"),
        zip_code: text("zip_code") || null,
        vat_registered: form.get("vat_registered") === "on",
        fiscal_year_start_month: Number(form.get("fiscal_year_start_month") ?? 1),
      },
    });
  } catch (e) {
    if (e instanceof ApiError) return { message: e.message, errors: e.errors };
    throw e;
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Company profile saved." };
}
