// ============================================================
// Dashboard Page — app/(dashboard)/dashboard/page.tsx
//
// The first page a user lands on after logging in.
//
// CURRENT STATUS (Step 2):
//   This is a functional placeholder that proves the full
//   auth flow works end-to-end:
//     Login → cookie set → proxy allows → page loads → user shown
//
//   Step 3 will replace this with the real full layout
//   (sidebar, topbar, incident board, etc.)
//
// WHAT THIS PAGE VERIFIES:
//   ✓ User is authenticated (proxy + useAuthGuard double-check)
//   ✓ UserProfile loads from Firestore correctly
//   ✓ Sign-out works and redirects back to /login
//   ✓ Loading state shown while auth is being confirmed
// ============================================================

import type { Metadata } from "next";
import { DashboardPlaceholder } from "@/components/auth/dashboard-placeholder";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return <DashboardPlaceholder />;
}
