// ============================================================
// Dashboard Layout — app/(dashboard)/layout.tsx
//
// Wraps all authenticated pages (dashboard, incidents, team,
// settings). Uses the (dashboard) route group so the folder
// name doesn't appear in the URL.
//
// The client-side shell owns authenticated navigation and shared controls.
// ============================================================

import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout/dashboard-shell";

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
  return <DashboardShell>{children}</DashboardShell>;
}
