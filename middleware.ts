import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSessionToken, SESSION_COOKIE_NAME } from "./lib/auth/session";

// Routes that do NOT require authentication
const PUBLIC_FILE_PATTERN = /\.(.*)$/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public static assets, PWA manifest/worker, icons, and API helpers
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/mobile") ||
    pathname.startsWith("/api/export") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/sw.js" ||
    pathname === "/manifest.json" ||
    pathname.startsWith("/icons/") ||
    PUBLIC_FILE_PATTERN.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Check session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const session = await decryptSessionToken(sessionCookie?.value);
  const isAuthenticated = !!session && !!session.userId;

  const isAuthRoute = pathname.startsWith("/auth");

  // 3. If unauthenticated user tries to access a protected route -> redirect to /auth
  if (!isAuthenticated && !isAuthRoute) {
    const returnUrl = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search);
    const authUrl = new URL(`/auth?returnUrl=${returnUrl}`, request.url);
    return NextResponse.redirect(authUrl);
  }

  // 4. If authenticated user tries to visit /auth without query actions -> redirect to home dashboard
  if (isAuthenticated && isAuthRoute) {
    const isVerificationOrReset = pathname.startsWith("/auth/verify") || pathname.startsWith("/auth/reset-password");
    if (!isVerificationOrReset) {
      const returnUrlParam = request.nextUrl.searchParams.get("returnUrl");
      const isSafeInternalPath =
        returnUrlParam &&
        returnUrlParam.startsWith("/") &&
        !returnUrlParam.startsWith("//") &&
        !returnUrlParam.includes(":") &&
        !returnUrlParam.includes("\\");
      const target = isSafeInternalPath ? returnUrlParam : "/";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg).*)",
  ],
};
