import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Incidents" };

export default function IncidentsPage() {
  return (
    <section className="rounded-xl border border-border/80 bg-background shadow-sm">
      <div className="border-b border-border/70 px-5 py-4 sm:px-6">
        <h2 className="font-semibold">Incident board</h2>
        <p className="mt-1 text-xs text-muted-foreground">Track every issue as your event unfolds.</p>
      </div>
      <EmptyState icon={AlertCircle} title="No incidents yet" description="Your live incident board will appear here when incident tracking is enabled." className="py-24" />
    </section>
  );
}