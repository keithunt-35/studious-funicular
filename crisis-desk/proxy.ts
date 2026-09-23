// ============================================================
// Next.js Proxy (formerly Middleware) — proxy.ts
//
// In Next.js 16, middleware.ts was renamed to proxy.ts and
// the exported function was renamed from `middleware` to `proxy`.
//
// Runs on the SERVER before any page renders.
// Handles route protection and auth-based redirects.
//
// ⚠️  IMPORTANT CONSTRAINT:
// The proxy runs server-side before the client Firebase SDK
// has a chance to run. We cannot call Firebase Auth directly here.
//
// SOLUTION — Cookie-based auth detection:
//   - After login, the client sets a lightweight cookie: "crisis-desk-auth"
//   - The proxy reads that cookie to decide if the user is logged in
//   - Real token verification happens in API routes via Firebase Admin SDK
//
// ROUTE MAP:
//   Public routes    → /login, /register, /forgot-password
//   Protected routes → /dashboard/*, /incidents/*, /team, /settings
//   Root /           → redirects based on auth state
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Route definitions ────────────────────────────────────────

/** Routes anyone can visit without being logged in */
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

/** Routes that require authentication */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/incidents",
  "/team",
  "/settings",
];

/** The cookie name set by the client after Firebase login */
const AUTH_COOKIE_NAME = "crisis-desk-auth";

// ── Helper functions ─────────────────────────────────────────

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
  return !!authCookie?.value;
}

// ── Proxy function (Next.js 16 convention) ───────────────────
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = isAuthenticated(request);

  // ── Case 1: Root path ──────────────────────────────────────
  // Redirect to dashboard if logged in, otherwise to login
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(authenticated ? "/dashboard" : "/login", request.url)
    );
  }

  // ── Case 2: Logged-in user visiting auth pages ─────────────
  // e.g. logged-in user manually navigates to /login
  if (authenticated && isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Case 3: Unauthenticated user on a protected route ───────
  // Redirect to /login and pass the intended destination as a
  // query param so we can redirect back after they sign in
  if (!authenticated && isProtectedRoute(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Case 4: Everything else ──────────────────────────────────
  // Let the request through normally
  return NextResponse.next();
}

// ── Matcher config ───────────────────────────────────────────
// Tells Next.js which paths this proxy should run on.
// Excludes static assets, images, and Next.js internals.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
