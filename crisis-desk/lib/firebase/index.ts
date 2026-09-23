// ============================================================
// Firebase — Barrel Export
//
// Import Firebase services from this single file anywhere
// in the app, instead of importing from individual files.
//
// Usage:
//   import { auth, db, storage } from "@/lib/firebase"
// ============================================================

export { default as app } from "./config";
export { default as auth } from "./auth";
export { default as db } from "./firestore";
export { default as storage } from "./storage";
