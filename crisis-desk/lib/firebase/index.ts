// ============================================================
// Firebase — Barrel Export
// Import Firebase services and helpers from this single file.
//
// Usage:
//   import { auth, db, storage } from "@/lib/firebase"
//   import { getUserProfile } from "@/lib/firebase"
// ============================================================

// Core Firebase service instances
export { default as app } from "./config";
export { default as auth } from "./auth";
export { default as db } from "./firestore";
export { default as storage } from "./storage";

// Auth context + hook
export { AuthProvider, useAuth } from "./auth-context";

// Firestore user profile helpers
export {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  ensureUserProfile,
  subscribeToTeamMembers,
} from "./user-helpers";

// Firestore paths and typed domain helpers
export {
  eventDocument,
  eventsCollection,
  incidentActivitiesCollection,
  incidentCommentsCollection,
  incidentDocument,
  incidentsCollection,
  userDocument,
  usersCollection,
  userNotificationPreferencesDocument,
} from "./paths";
export {
  createEvent,
  deactivateEvent,
  getEvent,
  saveEventDocument,
  updateEvent,
} from "./event-helpers";
export { getNotificationPreferences, updateNotificationPreferences } from "./notification-helpers";
export {
  createIncident,
  deleteIncident,
  getIncident,
  subscribeToIncident,
  subscribeToIncidents,
  updateIncident,
} from "./incident-helpers";
export { uploadIncidentPhoto } from "./storage-helpers";
export {
  addIncidentActivity,
  addIncidentComment,
  subscribeToIncidentActivities,
  subscribeToIncidentComments,
} from "./incident-detail-helpers";
