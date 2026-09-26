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
  isOnline?: boolean;
  lastSeenAt?: Date | null;
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
// Firestore domain types
// ------------------------------------------------------------

export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export type IncidentStatus = "open" | "in_progress" | "resolved" | "closed";

export type IncidentActivityType =
  | "created"
  | "status_changed"
  | "assigned"
  | "commented"
  | "resolved";

export interface EventDocument {
  id: string;
  name: string;
  venue?: string;
  timezone: string;
  categories?: string[];
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: string;
  location?: string | null;
  reportedBy: string;
  assignedTo?: string | null;
  eventId: string;
  photoUrl?: string | null;
  resolvedBy?: string | null;
  resolutionNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date | null;
}

export interface IncidentActivity {
  id: string;
  incidentId: string;
  eventId: string;
  type: IncidentActivityType;
  message: string;
  actorId: string;
  metadata?: Record<string, string | null>;
  createdAt: Date;
}

export interface IncidentComment {
  id: string;
  incidentId: string;
  eventId: string;
  authorId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  criticalOnly: boolean;
  updatedAt: Date;
}

export interface CreateIncidentInput {
  title: string;
  description: string;
  severity: IncidentSeverity;
  category: string;
  location?: string | null;
  eventId: string;
  reportedBy: string;
}

export interface UpdateIncidentInput {
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  category?: string;
  location?: string | null;
  assignedTo?: string | null;
  photoUrl?: string | null;
  resolvedBy?: string | null;
  resolutionNotes?: string | null;
  resolvedAt?: Date | null;
}
