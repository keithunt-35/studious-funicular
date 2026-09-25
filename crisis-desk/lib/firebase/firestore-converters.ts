import { Timestamp } from "firebase/firestore";

export type FirestoreTimestamp = Timestamp | Date | null | undefined;

export function timestampToDate(value: FirestoreTimestamp): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  return new Date();
}

export function nullableTimestampToDate(value: FirestoreTimestamp): Date | null {
  if (!value) return null;
  return timestampToDate(value);
}