import type { Metadata } from "next";
import { Settings2 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <section className="rounded-xl border border-border/80 bg-background shadow-sm">
      <div className="border-b border-border/70 px-5 py-4 sm:px-6">
        <h2 className="font-semibold">Workspace settings</h2>
        <p className="mt-1 text-xs text-muted-foreground">Configure your event workspace and response preferences.</p>
      </div>
      <EmptyState icon={Settings2} title="Settings are coming next" description="Event configuration and notification preferences will be available in the settings workspace." className="py-24" />
    </section>
  );
}