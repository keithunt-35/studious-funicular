"use client";

// ============================================================
// useAuthCookie — lib/hooks/use-auth-cookie.ts
//
// This hook keeps the auth cookie in sync with Firebase's
// auth state. It's the bridge between the Firebase client
// SDK (browser) and the Next.js middleware (edge server).
//
// HOW IT WORKS:
//   1. Firebase user logs in  → we set a cookie "crisis-desk-auth"
//   2. Middleware reads the cookie → lets user into /dashboard
//   3. Firebase user logs out → we clear the cookie
//   4. Middleware no longer sees the cookie → redirects to /login
//
// WHERE TO USE:
//   Call this once inside AuthProvider so it runs globally.
//
// COOKIE SECURITY:
//   - We don't store sensitive data in the cookie — just a flag
//   - The cookie is NOT httpOnly (client JS needs to set it)
//   - Real token verification happens via Firebase Admin SDK
//     in API routes (added in a later step)
// ============================================================

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const COOKIE_NAME = "crisis-desk-auth";

// Cookie max age: 7 days in seconds
// This matches Firebase Auth's default session length
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

function setAuthCookie() {
  // We store "1" as the value — just a presence indicator.
  // The actual auth verification uses Firebase on the client.
  document.cookie = [
    `${COOKIE_NAME}=1`,
    `max-age=${COOKIE_MAX_AGE}`,
    "path=/",
    // SameSite=Lax prevents CSRF while allowing normal navigation
    "SameSite=Lax",
    // Secure in production (HTTPS only) — omit in development
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function clearAuthCookie() {
  // Setting max-age=0 immediately expires (deletes) the cookie
  document.cookie = `${COOKIE_NAME}=; max-age=0; path=/`;
}

export function useAuthCookie() {
  useEffect(() => {
    // Listen to Firebase auth state and mirror it to the cookie
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthCookie();
      } else {
        clearAuthCookie();
      }
    });

    return () => unsubscribe();
  }, []);
}
