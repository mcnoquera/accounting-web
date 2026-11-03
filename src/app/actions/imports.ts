"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api/client";
import type { ImportKind, ImportResult } from "@/types";

export interface ImportState {
  ok?: boolean;
  committed?: boolean;
  message?: string;
  csv?: string;
  result?: ImportResult;
}

const MAX_BYTES = 2_000_000;

/** Reads the uploaded CSV and asks the API what would happen, without writing anything. */
export async function previewImport(kind: ImportKind, _prev: ImportState, form: FormData): Promise<ImportState> {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { message: "Choose a CSV file." };
  if (file.size > MAX_BYTES) return { message: "The file is larger than 2 MB. Split it and import in parts." };
  const csv = await file.text();
  try {
    const res = await api<ImportResult>(`/imports/${kind}/preview`, { method: "POST", body: { csv } });
    return { ok: true, csv, result: res.data };
  } catch (e) {
    if (e instanceof ApiError) return { message: e.message };
    throw e;
  }
}

/** Imports the previewed CSV (sent back as text, so it's exactly what was previewed). */
export async function commitImport(kind: ImportKind, _prev: ImportState, form: FormData): Promise<ImportState> {
  const csv = String(form.get("csv") ?? "");
  try {
    const res = await api<ImportResult>(`/imports/${kind}/commit`, { method: "POST", body: { csv } });
    revalidatePath(kind === "accounts" ? "/accounts" : "/contacts");
    const s = res.data.summary;
    return { ok: true, committed: true, result: res.data, message: `Imported: ${s.create} created, ${s.update} updated, ${s.unchanged} unchanged.` };
  } catch (e) {
    if (e instanceof ApiError) return { message: e.message, csv };
    throw e;
  }
}
