import { collection, doc } from "firebase/firestore";

import { FIRESTORE_COLLECTIONS } from "@/constants";
import { db } from "@/lib/firebase";

export const usersCollection = () => collection(db, FIRESTORE_COLLECTIONS.users);
export const userDocument = (uid: string) => doc(db, FIRESTORE_COLLECTIONS.users, uid);
export const eventsCollection = () => collection(db, FIRESTORE_COLLECTIONS.events);
export const eventDocument = (eventId: string) => doc(db, FIRESTORE_COLLECTIONS.events, eventId);
export const incidentsCollection = () => collection(db, FIRESTORE_COLLECTIONS.incidents);
export const incidentDocument = (incidentId: string) => doc(db, FIRESTORE_COLLECTIONS.incidents, incidentId);
export const incidentActivitiesCollection = (incidentId: string) => collection(incidentDocument(incidentId), FIRESTORE_COLLECTIONS.activities);
export const incidentCommentsCollection = (incidentId: string) => collection(incidentDocument(incidentId), FIRESTORE_COLLECTIONS.comments);
export const userNotificationPreferencesDocument = (uid: string) => doc(userDocument(uid), FIRESTORE_COLLECTIONS.notificationPreferences, "default");