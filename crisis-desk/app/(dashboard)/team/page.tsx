import type { Metadata } from "next";
import { Users } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  return (
    <section className="rounded-xl border border-border/80 bg-background shadow-sm">
      <div className="border-b border-border/70 px-5 py-4 sm:px-6">
        <h2 className="font-semibold">Response team</h2>
        <p className="mt-1 text-xs text-muted-foreground">See who is available to coordinate the next response.</p>
      </div>
      <EmptyState icon={Users} title="Your team is ready to be assembled" description="Team members and workload will appear here once the event workspace is configured." className="py-24" />
    </section>
  );
}