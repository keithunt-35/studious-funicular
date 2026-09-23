"use client";

// ============================================================
// useCurrentUser — lib/hooks/use-current-user.ts
//
// A lightweight hook for components that just need to read
// the current user's profile — without any redirect logic.
//
// Use this inside dashboard components, nav bars, avatars, etc.
// Use useAuthGuard() for pages that need protection.
//
// Usage:
//   const { userProfile } = useCurrentUser();
//   <span>{userProfile?.displayName}</span>
// ============================================================

import { useAuth } from "@/lib/firebase/auth-context";

export function useCurrentUser() {
  const { userProfile, loading, isAuthenticated, signOut } = useAuth();

  return {
    /** The current user's Firestore profile */
    userProfile,
    /** True while Firebase is loading */
    loading,
    /** True if user is logged in */
    isAuthenticated,
    /** Sign out the current user */
    signOut,
    /** Shorthand: user's display name */
    displayName: userProfile?.displayName ?? "User",
    /** Shorthand: user's email */
    email: userProfile?.email ?? "",
    /** Shorthand: user's role */
    role: userProfile?.role ?? null,
    /** Shorthand: user's first name only */
    firstName: userProfile?.displayName?.split(" ")[0] ?? "User",
  };
}
