import { getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import type { NotificationPreferences } from "@/types";
import { userNotificationPreferencesDocument } from "@/lib/firebase/paths";
import { timestampToDate } from "@/lib/firebase/firestore-converters";

const defaultPreferences: Omit<NotificationPreferences, "updatedAt"> = {
  email: true,
  sms: false,
  push: true,
  criticalOnly: false,
};

export async function getNotificationPreferences(uid: string): Promise<NotificationPreferences> {
  const snapshot = await getDoc(userNotificationPreferencesDocument(uid));
  if (!snapshot.exists()) return { ...defaultPreferences, updatedAt: new Date() };
  const data = snapshot.data();
  return {
    email: data.email !== false,
    sms: data.sms === true,
    push: data.push !== false,
    criticalOnly: data.criticalOnly === true,
    updatedAt: timestampToDate(data.updatedAt),
  };
}

export async function updateNotificationPreferences(
  uid: string,
  preferences: Omit<NotificationPreferences, "updatedAt">
): Promise<void> {
  await setDoc(userNotificationPreferencesDocument(uid), {
    ...preferences,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}