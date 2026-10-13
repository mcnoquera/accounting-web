"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError, TOKEN_COOKIE } from "@/lib/api/client";
import type { ActionState } from "@/lib/action-state";
import type { User } from "@/types";

export async function login(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { data } = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email: form.get("email"), password: form.get("password") },
    });
    cookies().set(TOKEN_COOKIE, data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  } catch (e) {
    if (e instanceof ApiError) return { message: e.errors.email?.[0] ?? e.message, errors: e.errors };
    return { message: "Could not reach the accounting API. Is it running?" };
  }
  const next = String(form.get("next") ?? "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch {
    // Token may already be invalid; clearing the cookie is what matters.
  }
  cookies().delete(TOKEN_COOKIE);
  redirect("/login");
}
