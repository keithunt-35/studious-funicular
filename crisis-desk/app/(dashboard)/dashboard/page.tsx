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
import Link from "next/link";
import { Activity, ArrowUpRight, CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Overview",
};

const summaryCards = [
  { label: "Open incidents", value: "0", detail: "Nothing needs attention", icon: ShieldAlert, className: "text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300" },
  { label: "In progress", value: "0", detail: "No active responses", icon: Activity, className: "text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300" },
  { label: "Resolved today", value: "0", detail: "Your team is ready", icon: CheckCircle2, className: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300" },
  { label: "Avg. response", value: "--", detail: "No response data yet", icon: Clock3, className: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-medium text-red-700 dark:text-red-400">Today&apos;s command view</p><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Stay ahead of every moment.</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">This is your calm center for live event operations. Incidents, assignments, and updates will appear here as your event comes to life.</p></div><Link className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-lg bg-red-700 px-3 text-sm font-medium text-white transition-colors hover:bg-red-800" href="/incidents">Open incident board<ArrowUpRight className="size-4" /></Link></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Operations summary">{summaryCards.map((card) => { const Icon = card.icon; return <div key={card.label} className="rounded-xl border border-border/80 bg-background p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">{card.label}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{card.value}</p></div><div className={`flex size-9 items-center justify-center rounded-lg ${card.className}`}><Icon className="size-[18px]" /></div></div><p className="mt-4 text-xs text-muted-foreground">{card.detail}</p></div>; })}</section>
      <section className="rounded-xl border border-border/80 bg-background shadow-sm"><div className="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6"><div><h3 className="font-semibold">Recent activity</h3><p className="mt-1 text-xs text-muted-foreground">A live pulse of your event workspace.</p></div><span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"><span className="size-1.5 rounded-full bg-emerald-500" />Live</span></div><EmptyState icon={Activity} title="Your activity feed is clear" description="When your team logs an incident or updates a response, the latest activity will appear here." className="py-20" /></section>
    </div>
  );
}
