import {
  addDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import type { CreateIncidentInput, Incident, UpdateIncidentInput } from "@/types";
import { incidentDocument, incidentsCollection } from "@/lib/firebase/paths";
import { nullableTimestampToDate, timestampToDate } from "@/lib/firebase/firestore-converters";

export function documentToIncident(id: string, data: Record<string, unknown>): Incident {
  return {
    id,
    title: String(data.title ?? "Untitled incident"),
    description: String(data.description ?? ""),
    severity: (data.severity as Incident["severity"]) ?? "medium",
    status: (data.status as Incident["status"]) ?? "open",
    category: String(data.category ?? "Other"),
    location: typeof data.location === "string" ? data.location : null,
    reportedBy: String(data.reportedBy ?? ""),
    assignedTo: typeof data.assignedTo === "string" ? data.assignedTo : null,
    eventId: String(data.eventId ?? ""),
    photoUrl: typeof data.photoUrl === "string" ? data.photoUrl : null,
    resolvedBy: typeof data.resolvedBy === "string" ? data.resolvedBy : null,
    resolutionNotes: typeof data.resolutionNotes === "string" ? data.resolutionNotes : null,
    createdAt: timestampToDate(data.createdAt as Incident["createdAt"]),
    updatedAt: timestampToDate(data.updatedAt as Incident["updatedAt"]),
    resolvedAt: nullableTimestampToDate(data.resolvedAt as Incident["resolvedAt"]),
  };
}

export function subscribeToIncidents(
  onChange: (incidents: Incident[]) => void,
  onError: (error: Error) => void
): () => void {
  const incidentsQuery = query(incidentsCollection(), orderBy("createdAt", "desc"));

  return onSnapshot(
    incidentsQuery,
    (snapshot) => {
      onChange(snapshot.docs.map((document) => documentToIncident(document.id, document.data())));
    },
    (error) => onError(error)
  );
}

export async function getIncident(incidentId: string): Promise<Incident | null> {
  const snapshot = await getDoc(incidentDocument(incidentId));
  return snapshot.exists() ? documentToIncident(snapshot.id, snapshot.data()) : null;
}

export function subscribeToIncident(
  incidentId: string,
  onChange: (incident: Incident | null) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    incidentDocument(incidentId),
    (snapshot) => onChange(snapshot.exists() ? documentToIncident(snapshot.id, snapshot.data()) : null),
    onError
  );
}

export async function createIncident(input: CreateIncidentInput): Promise<string> {
  const reference = await addDoc(incidentsCollection(), {
    ...input,
    status: "open",
    assignedTo: null,
    resolvedBy: null,
    resolutionNotes: null,
    resolvedAt: null,
    photoUrl: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function updateIncident(incidentId: string, updates: UpdateIncidentInput): Promise<void> {
  await updateDoc(incidentDocument(incidentId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteIncident(incidentId: string): Promise<void> {
  await deleteDoc(incidentDocument(incidentId));
}