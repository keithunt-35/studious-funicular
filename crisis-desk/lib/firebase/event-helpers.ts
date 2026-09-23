import { addDoc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

import type { EventDocument } from "@/types";
import { eventDocument, eventsCollection } from "@/lib/firebase/paths";
import { nullableTimestampToDate, timestampToDate } from "@/lib/firebase/firestore-converters";

function documentToEvent(id: string, data: Record<string, unknown>): EventDocument {
  return {
    id,
    name: String(data.name ?? "Untitled event"),
    venue: typeof data.venue === "string" ? data.venue : undefined,
    timezone: String(data.timezone ?? "UTC"),
    categories: Array.isArray(data.categories) ? data.categories.filter((value): value is string => typeof value === "string") : undefined,
    startsAt: nullableTimestampToDate(data.startsAt as EventDocument["startsAt"]),
    endsAt: nullableTimestampToDate(data.endsAt as EventDocument["endsAt"]),
    isActive: data.isActive !== false,
    createdBy: String(data.createdBy ?? ""),
    createdAt: timestampToDate(data.createdAt as EventDocument["createdAt"]),
    updatedAt: timestampToDate(data.updatedAt as EventDocument["updatedAt"]),
  };
}

export async function getEvent(eventId: string): Promise<EventDocument | null> {
  const snapshot = await getDoc(eventDocument(eventId));
  return snapshot.exists() ? documentToEvent(snapshot.id, snapshot.data()) : null;
}

export interface CreateEventInput {
  name: string;
  venue?: string;
  timezone: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
  createdBy: string;
}

export async function createEvent(input: CreateEventInput): Promise<string> {
  const reference = await addDoc(eventsCollection(), {
    ...input,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function updateEvent(eventId: string, updates: Partial<Pick<EventDocument, "name" | "venue" | "timezone" | "categories" | "startsAt" | "endsAt" | "isActive">>): Promise<void> {
  await updateDoc(eventDocument(eventId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function saveEventDocument(eventId: string, input: CreateEventInput & { categories?: string[] }): Promise<void> {
  await setDoc(eventDocument(eventId), {
    ...input,
    categories: input.categories ?? [],
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deactivateEvent(eventId: string): Promise<void> {
  await updateDoc(eventDocument(eventId), {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
}