import { NextResponse, type NextRequest } from "next/server";

const TOKEN_COOKIE = "ledgerly_token";

export function middleware(req: NextRequest) {
  const hasToken = req.cookies.has(TOKEN_COOKIE);
  const isLogin = req.nextUrl.pathname === "/login";

  if (!hasToken && !isLogin) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
