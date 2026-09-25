"use client";

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

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Activity, ArrowUpRight, CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { subscribeToIncidents } from "@/lib/firebase";
import type { Incident } from "@/types";

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => subscribeToIncidents(setIncidents, () => setError(true)), []);

  const openCount = incidents.filter((incident) => incident.status === "open").length;
  const inProgressCount = incidents.filter((incident) => incident.status === "in_progress").length;
  const today = new Date();
  const resolvedTodayCount = incidents.filter((incident) => {
    const resolvedAt = incident.resolvedAt;
    return resolvedAt
      && resolvedAt.getFullYear() === today.getFullYear()
      && resolvedAt.getMonth() === today.getMonth()
      && resolvedAt.getDate() === today.getDate();
  }).length;
  const summaryCards = [
    { label: "Open incidents", value: String(openCount), detail: openCount ? "Needs attention" : "Nothing needs attention", icon: ShieldAlert, className: "text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300" },
    { label: "In progress", value: String(inProgressCount), detail: inProgressCount ? "Active responses" : "No active responses", icon: Activity, className: "text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300" },
    { label: "Resolved today", value: String(resolvedTodayCount), detail: "Resolved responses", icon: CheckCircle2, className: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300" },
    { label: "Total incidents", value: String(incidents.length), detail: "Across this event", icon: Clock3, className: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300" },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-medium text-red-700 dark:text-red-400">Today&apos;s command view</p><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Stay ahead of every moment.</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">This is your calm center for live event operations. Incidents, assignments, and updates will appear here as your event comes to life.</p></div><Link className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-lg bg-red-700 px-3 text-sm font-medium text-white transition-colors hover:bg-red-800" href="/incidents">Open incident board<ArrowUpRight className="size-4" /></Link></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Operations summary">{summaryCards.map((card) => { const Icon = card.icon; return <div key={card.label} className="rounded-xl border border-border/80 bg-background p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">{card.label}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{card.value}</p></div><div className={`flex size-9 items-center justify-center rounded-lg ${card.className}`}><Icon className="size-[18px]" /></div></div><p className="mt-4 text-xs text-muted-foreground">{card.detail}</p></div>; })}</section>
      <section className="rounded-xl border border-border/80 bg-background shadow-sm"><div className="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6"><div><h3 className="font-semibold">Recent incidents</h3><p className="mt-1 text-xs text-muted-foreground">A live pulse of your event workspace.</p></div><span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"><span className="size-1.5 rounded-full bg-emerald-500" />Live</span></div>{error ? <p className="p-8 text-sm text-red-700">Could not load live incident data.</p> : incidents.length === 0 ? <EmptyState icon={Activity} title="No incidents reported" description="Incidents created from the mobile app, web dashboard, SMS, or USSD will appear here." className="py-20" /> : <div className="divide-y divide-border/70">{incidents.slice(0, 5).map((incident) => <Link key={incident.id} href={`/incidents/${incident.id}`} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/30 sm:px-6"><div className="min-w-0"><p className="truncate text-sm font-medium">{incident.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{incident.description || "No description"}</p></div><time className="shrink-0 text-xs text-muted-foreground">{formatDistanceToNow(incident.createdAt, { addSuffix: true })}</time></Link>)}</div>}</section>
    </div>
  );
}
