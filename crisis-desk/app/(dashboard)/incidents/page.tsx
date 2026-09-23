import type { Metadata } from "next";
import { IncidentBoard } from "@/components/incidents/incident-board";

export const metadata: Metadata = { title: "Incidents" };

export default function IncidentsPage() {
  return <IncidentBoard />;
}