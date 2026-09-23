import {
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import type { IncidentActivity, IncidentComment, IncidentActivityType } from "@/types";
import { incidentActivitiesCollection, incidentCommentsCollection } from "@/lib/firebase/paths";
import { timestampToDate } from "@/lib/firebase/firestore-converters";

function documentToActivity(id: string, data: Record<string, unknown>): IncidentActivity {
  return {
    id,
    incidentId: String(data.incidentId ?? ""),
    eventId: String(data.eventId ?? ""),
    type: (data.type as IncidentActivityType) ?? "commented",
    message: String(data.message ?? ""),
    actorId: String(data.actorId ?? ""),
    metadata: data.metadata as IncidentActivity["metadata"],
    createdAt: timestampToDate(data.createdAt as IncidentActivity["createdAt"]),
  };
}

function documentToComment(id: string, data: Record<string, unknown>): IncidentComment {
  return {
    id,
    incidentId: String(data.incidentId ?? ""),
    eventId: String(data.eventId ?? ""),
    authorId: String(data.authorId ?? ""),
    body: String(data.body ?? ""),
    createdAt: timestampToDate(data.createdAt as IncidentComment["createdAt"]),
    updatedAt: timestampToDate(data.updatedAt as IncidentComment["updatedAt"]),
  };
}

export function subscribeToIncidentActivities(
  incidentId: string,
  onChange: (activities: IncidentActivity[]) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    query(incidentActivitiesCollection(incidentId), orderBy("createdAt", "asc")),
    (snapshot) => onChange(snapshot.docs.map((document) => documentToActivity(document.id, document.data()))),
    onError
  );
}

export function subscribeToIncidentComments(
  incidentId: string,
  onChange: (comments: IncidentComment[]) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    query(incidentCommentsCollection(incidentId), orderBy("createdAt", "asc")),
    (snapshot) => onChange(snapshot.docs.map((document) => documentToComment(document.id, document.data()))),
    onError
  );
}

export async function addIncidentActivity(input: Omit<IncidentActivity, "id" | "createdAt">): Promise<void> {
  await addDoc(incidentActivitiesCollection(input.incidentId), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function addIncidentComment(input: Omit<IncidentComment, "id" | "createdAt" | "updatedAt">): Promise<void> {
  await addDoc(incidentCommentsCollection(input.incidentId), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}