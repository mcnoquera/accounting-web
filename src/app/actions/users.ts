"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api/client";
import type { ActionState } from "@/lib/action-state";

function fail(e: unknown): ActionState {
  if (e instanceof ApiError) return { message: e.message, errors: e.errors };
  throw e;
}

async function run(call: () => Promise<unknown>, message: string): Promise<ActionState> {
  try {
    await call();
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/settings/users");
  return { ok: true, message };
}

export async function createUser(_prev: ActionState, form: FormData): Promise<ActionState> {
  return run(() => api("/users", {
    method: "POST",
    body: {
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      role: form.get("role"),
      password: form.get("password"),
    },
  }), "User added. Share the temporary password with them privately.");
}

export async function changeRole(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  return run(() => api(`/users/${id}`, { method: "PUT", body: { role: form.get("role") } }), "Role updated.");
}

export async function setActive(id: number, active: boolean, _prev: ActionState, _form: FormData): Promise<ActionState> {
  return run(() => api(`/users/${id}`, { method: "PUT", body: { is_active: active } }), active ? "User reactivated." : "User deactivated and signed out.");
}

export async function unlockUser(id: number, _prev: ActionState, _form: FormData): Promise<ActionState> {
  return run(() => api(`/users/${id}/unlock`, { method: "POST" }), "Account unlocked.");
}
