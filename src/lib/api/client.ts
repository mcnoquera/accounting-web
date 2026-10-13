import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const TOKEN_COOKIE = "ledgerly_token";
const API_URL = process.env.API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

type Query = Record<string, string | number | undefined | null>;

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${API_URL}${path}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  return url.toString();
}

/**
 * Server-side call to the Laravel API using the session token cookie.
 * The token never reaches browser JavaScript.
 */
export async function api<T>(path: string, init: { method?: string; body?: unknown; query?: Query; token?: string } = {}): Promise<{ data: T; meta?: unknown }> {
  const token = init.token ?? cookies().get(TOKEN_COOKIE)?.value;
  const res = await fetch(buildUrl(path, init.query), {
    method: init.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  if (res.status === 401 && !path.startsWith("/auth/login")) {
    redirect("/login?expired=1");
  }
  if (res.status === 404 && (init.method ?? "GET") === "GET") {
    notFound();
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new ApiError(json?.message ?? `Request failed (${res.status})`, res.status, json?.errors ?? {});
  }
  return json;
}

export async function apiData<T>(path: string, query?: Query): Promise<T> {
  return (await api<T>(path, { query })).data;
}
