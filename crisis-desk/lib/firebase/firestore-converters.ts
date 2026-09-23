import { Timestamp } from "firebase/firestore";

export type FirestoreTimestamp = Timestamp | Date | null | undefined;

export function timestampToDate(value: FirestoreTimestamp): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

export function nullableTimestampToDate(value: FirestoreTimestamp): Date | null {
  if (!value) return null;
  return timestampToDate(value);
}