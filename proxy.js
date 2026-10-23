import { NextResponse } from "next/server";

export function proxy(request) {
  const pathname = request.nextUrl.pathname;
  const protectedPath = pathname.startsWith("/owner") || pathname.startsWith("/admin");
  const hasSessionCookie = request.cookies.get("better-auth.session_token") || request.cookies.get("__Secure-better-auth.session_token");
  if (protectedPath && !hasSessionCookie) return NextResponse.redirect(new URL("/owner/sign-in", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/owner/:path*", "/admin/:path*"] };
