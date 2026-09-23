// ============================================================
// Crisis Desk — Global Type Definitions
// All TypeScript interfaces for the entire app live here.
// Step 4 will expand the Incident/Event types further.
// ============================================================

// ------------------------------------------------------------
// User & Auth Types
// ------------------------------------------------------------

/** The roles a user can have in the system */
export type UserRole = "event_lead" | "dept_lead" | "staff";

/**
 * A Crisis Desk user profile stored in Firestore.
 * This extends Firebase Auth with app-specific fields
 * (role, department, etc.) that Firebase Auth doesn't store.
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  department?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

/**
 * The value exposed by AuthContext to the rest of the app.
 * Components call useAuth() to get this.
 */
export interface AuthContextValue {
  /** The current user's Firestore profile (null if not logged in) */
  userProfile: UserProfile | null;
  /** Whether we are still waiting for Firebase to confirm auth state */
  loading: boolean;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Sign out the current user */
  signOut: () => Promise<void>;
}

// ------------------------------------------------------------
// Incident Types (skeleton — expanded fully in Step 4)
// ------------------------------------------------------------

export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export type IncidentStatus = "open" | "in_progress" | "resolved" | "closed";

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: string;
  location?: string;
  reportedBy: string;         // user uid
  assignedTo?: string | null; // user uid
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date | null;
}
