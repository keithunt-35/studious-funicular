import type { Metadata } from "next";

import { IncidentDetail } from "@/components/incidents/incident-detail";

export const metadata: Metadata = { title: "Incident details" };

interface IncidentPageProps {
  params: Promise<{ id: string }>;
}

export default async function IncidentPage({ params }: IncidentPageProps) {
  const { id } = await params;
  return <IncidentDetail incidentId={id} />;
}