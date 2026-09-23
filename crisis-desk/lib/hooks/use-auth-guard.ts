"use client";

// ============================================================
// useAuthGuard — lib/hooks/use-auth-guard.ts
//
// A hook for protected pages. Use this at the top of any
// page component that requires the user to be logged in.
//
// It handles three states automatically:
//   1. Loading  → show a spinner while Firebase confirms auth
//   2. Unauthenticated → redirect to /login
//   3. Authenticated → return the user profile so the page
//      can render
//
// Usage:
//   const { userProfile, loading } = useAuthGuard();
//   if (loading) return <PageLoader />;
//   // userProfile is guaranteed non-null here
// ============================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import type { UserRole } from "@/types";

interface UseAuthGuardOptions {
  /**
   * Optional: restrict page to specific roles only.
   * If the user doesn't have one of these roles,
   * they get redirected to /dashboard.
   *
   * Example: requiredRoles: ["event_lead"]
   */
  requiredRoles?: UserRole[];
  /** Where to redirect unauthenticated users. Default: /login */
  redirectTo?: string;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { redirectTo = "/login", requiredRoles } = options;
  const { userProfile, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't do anything while Firebase is still loading
    if (loading) return;

    // Not logged in → redirect to login
    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    // Role check: if requiredRoles is set and user doesn't qualify,
    // send them to the dashboard (they're logged in, just not authorized)
    if (requiredRoles && userProfile) {
      const hasRequiredRole = requiredRoles.includes(userProfile.role);
      if (!hasRequiredRole) {
        router.replace("/dashboard");
      }
    }
  }, [loading, isAuthenticated, userProfile, router, redirectTo, requiredRoles]);

  return {
    userProfile,
    loading,
    isAuthenticated,
  };
}
