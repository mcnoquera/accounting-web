"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api/client";
import type { ActionState } from "@/lib/action-state";

async function run(call: () => Promise<{ meta?: unknown }>, message: (meta: Record<string, unknown>) => string): Promise<ActionState> {
  let meta: Record<string, unknown> = {};
  try {
    meta = ((await call()).meta ?? {}) as Record<string, unknown>;
  } catch (e) {
    if (e instanceof ApiError) return { message: e.message, errors: e.errors };
    throw e;
  }
  // Period status changes what can be posted anywhere in the app.
  revalidatePath("/", "layout");
  return { ok: true, message: message(meta) };
}

export async function closePeriod(period: string, _prev: ActionState, _form: FormData): Promise<ActionState> {
  return run(
    () => api(`/periods/${period}/close`, { method: "POST" }),
    (meta) => {
      const drafts = Number(meta.draft_count ?? 0);
      return drafts > 0
        ? `${period} closed. ${drafts} draft${drafts === 1 ? "" : "s"} still dated in it can't be posted unless moved to an open date.`
        : `${period} closed.`;
    },
  );
}

export async function reopenPeriod(period: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return run(
    () => api(`/periods/${period}/reopen`, { method: "POST", body: { reason: String(form.get("reason") ?? "").trim() } }),
    () => `${period} reopened. Entries dated in it can be posted, voided and edited again.`,
  );
}
