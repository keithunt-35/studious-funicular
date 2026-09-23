// ============================================================
// Dashboard Layout — app/(dashboard)/layout.tsx
//
// Wraps all authenticated pages (dashboard, incidents, team,
// settings). Uses the (dashboard) route group so the folder
// name doesn't appear in the URL.
//
// Right now this is a minimal shell.
// Step 3 will replace this with the full sidebar + topbar layout.
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Crisis Desk",
    default: "Dashboard | Crisis Desk",
  },
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    // min-h-screen ensures the background fills even on short pages
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
