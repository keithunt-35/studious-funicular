// ============================================================
// User Profile Helpers — lib/firebase/user-helpers.ts
//
// All Firestore read/write operations for user profiles.
//
// Firestore structure:
//   /users/{uid}  →  UserProfile document
//
// WHY SEPARATE FROM AUTH?
//   Firebase Auth handles login/logout/sessions.
//   Firestore handles everything else about a user:
//   their role, department, display name, etc.
//   These helpers are the bridge between the two.
// ============================================================

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile, UserRole } from "@/types";

// ── Collection name constant ─────────────────────────────────
// Using a constant prevents typos ("user" vs "users") across files
const USERS_COLLECTION = "users";

// ── Helper: Convert Firestore Timestamp → JS Date ───────────
// Firestore stores dates as Timestamp objects.
// Our app uses plain JS Date objects everywhere.
function toDate(value: Timestamp | Date | undefined | null): Date {
  if (!value) return new Date();
  if (value instanceof Timestamp) return value.toDate();
  return value;
}

// ── Helper: Convert raw Firestore doc → typed UserProfile ────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToUserProfile(uid: string, data: Record<string, any>): UserProfile {
  return {
    uid,
    email: data.email ?? "",
    displayName: data.displayName ?? "Unknown User",
    photoURL: data.photoURL ?? null,
    role: (data.role as UserRole) ?? "staff",
    department: data.department ?? undefined,
    phone: data.phone ?? undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    isActive: data.isActive ?? true,
  };
}

// ============================================================
// getUserProfile
// Fetches a single user's profile from Firestore by their uid.
// Returns null if the document doesn't exist.
//
// Used by: AuthContext (on every login / page refresh)
// ============================================================
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return docToUserProfile(uid, docSnap.data());
  } catch (error) {
    console.error(`getUserProfile(${uid}) failed:`, error);
    throw error;
  }
}

// ============================================================
// createUserProfile
// Creates a new user profile document in Firestore.
// Called once during registration, right after Firebase Auth
// creates the user account.
//
// Used by: RegisterForm (Step 2)
// ============================================================
export interface CreateUserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role?: UserRole;
}

export async function createUserProfile(
  data: CreateUserProfileData
): Promise<UserProfile> {
  const docRef = doc(db, USERS_COLLECTION, data.uid);

  // The document we'll write to Firestore
  const profileData = {
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL ?? null,
    // New users default to "staff" role.
    // An event_lead can promote them later (Step 8/9).
    role: data.role ?? "staff",
    department: null,
    phone: null,
    isActive: true,
    // serverTimestamp() stores the server's time, not the client's.
    // This prevents clock skew issues across different devices.
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, profileData);

  // Return a typed profile (convert serverTimestamp → Date for local use)
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL ?? null,
    role: data.role ?? "staff",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================================
// updateUserProfile
// Partially updates a user's profile in Firestore.
// Only the fields you pass will be changed.
//
// Used by: Settings page (Step 9), profile editing
// ============================================================
export type UpdateUserProfileData = Partial<
  Pick<UserProfile, "displayName" | "photoURL" | "department" | "phone" | "role">
>;

export async function updateUserProfile(
  uid: string,
  updates: UpdateUserProfileData
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);

  await updateDoc(docRef, {
    ...updates,
    // Always update the timestamp when the profile changes
    updatedAt: serverTimestamp(),
  });
}

// ============================================================
// ensureUserProfile
// Called after Google Sign-in to create a profile if one
// doesn't already exist, or return the existing one.
//
// Google users may already have a profile from a previous
// sign-in, so we check first before creating.
//
// Used by: Google sign-in handler (Step 2)
// ============================================================
export async function ensureUserProfile(data: CreateUserProfileData): Promise<UserProfile> {
  // Check if profile already exists
  const existing = await getUserProfile(data.uid);
  if (existing) {
    return existing;
  }

  // First time Google sign-in — create their profile
  return createUserProfile(data);
}
