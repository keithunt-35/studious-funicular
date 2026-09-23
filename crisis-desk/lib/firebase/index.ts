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
} from "./user-helpers";
