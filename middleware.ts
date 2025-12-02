import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "sbx_training_session";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const { pathname, searchParams } = request.nextUrl;

  // Check for Schoolbox authentication parameters
  const key = searchParams.get("key");
  const time = searchParams.get("time");
  const id = searchParams.get("id");
  const user = searchParams.get("user");

  // If we have auth parameters, redirect to /api/verify
  if (key && time && id && user) {
    console.log("[middleware] Detected Schoolbox auth parameters, redirecting to /api/verify");
    const verifyUrl = new URL("/api/verify", request.url);
    verifyUrl.searchParams.set("key", key);
    verifyUrl.searchParams.set("time", time);
    verifyUrl.searchParams.set("id", id);
    verifyUrl.searchParams.set("user", user);
    return NextResponse.redirect(verifyUrl);
  }

  // Allow public routes without authentication
  const publicRoutes = ["/", "/login", "/unauthorized"];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check session for protected routes
  if (!sessionCookie) {
    console.log("[middleware] No session cookie, redirecting to unauthorized");
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    const now = Math.floor(Date.now() / 1000);

    // Check session expiry
    if (session.expires < now) {
      console.log("[middleware] Session expired, redirecting to unauthorized");
      return NextResponse.redirect(new URL("/unauthorized?error=expired", request.url));
    }

    // Check if user is staff (this app is staff-only)
    if (session.role !== "staff") {
      console.log("[middleware] Non-staff user, redirecting to unauthorized");
      return NextResponse.redirect(new URL("/unauthorized?error=forbidden", request.url));
    }

    // If accessing /admin routes, verify admin role
    if (pathname.startsWith("/admin")) {
      if (!session.isAdmin) {
        console.log("[middleware] Non-admin accessing admin route, redirecting");
        return NextResponse.redirect(new URL("/dashboard?error=forbidden", request.url));
      }
    }
  } catch (error) {
    console.error("[middleware] Session parse error:", error);
    return NextResponse.redirect(new URL("/unauthorized?error=invalid", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/verify (Schoolbox Remote Service auth endpoint)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/verify).*)",
  ],
};
