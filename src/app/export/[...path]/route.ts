import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/api/client";
import { isAllowedExportPath } from "@/lib/exports";

const API_URL = process.env.API_URL ?? "http://localhost:8000/api/v1";

// Server-side download proxy: the API token lives in an httpOnly cookie, so the browser can't
// call the API directly. Only export endpoints are forwarded; the API audits every export.
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = "/" + params.path.map(encodeURIComponent).join("/");
  if (!isAllowedExportPath(path)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  const res = await fetch(`${API_URL}${path}${req.nextUrl.search}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 401) return NextResponse.redirect(new URL("/login?expired=1", req.url));
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const message = json?.message ?? `Export failed (${res.status})`;
    return new NextResponse(message, { status: res.status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const h of ["Content-Type", "Content-Disposition", "Content-Length"]) {
    const v = res.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new NextResponse(res.body, { status: 200, headers });
}
