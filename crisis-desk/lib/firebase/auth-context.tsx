"use client";

// ============================================================
// AuthContext — lib/firebase/auth-context.tsx
//
// This is the global authentication state for Crisis Desk.
//
// HOW IT WORKS:
//   1. Firebase's onAuthStateChanged fires whenever the user
//      logs in, logs out, or the page refreshes.
//   2. We listen to that event and store the user's profile
//      in React context.
//   3. Every component in the app can call useAuth() to
//      access the current user without prop drilling.
//
// WHY TWO SOURCES (Firebase Auth + Firestore)?
//   Firebase Auth only stores basic info: uid, email, displayName.
//   We need more: role, department, phone, etc.
//   So we store a full UserProfile document in Firestore and
//   fetch it alongside the Firebase Auth user object.
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/firebase/user-helpers";
import { useAuthCookie } from "@/lib/hooks/use-auth-cookie";
import type { AuthContextValue, UserProfile } from "@/types";

// ── 1. Create the context ──────────────────────────────────
// We start with `undefined` so we can detect if someone tries
// to use useAuth() outside of the AuthProvider (developer error).
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── 2. AuthProvider component ──────────────────────────────
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // The full Firestore user profile (null = not logged in)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Keeps the auth cookie in sync with Firebase auth state.
  // The cookie is what Next.js middleware reads for route protection.
  useAuthCookie();

  // `loading` is true until Firebase has confirmed auth state.
  // We start as `true` to avoid a flash of the login page
  // when a logged-in user refreshes the dashboard.
  const [loading, setLoading] = useState(true);

  // ── Sign out helper ──────────────────────────────────────
  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
  }, []);

  // ── Auth state listener ──────────────────────────────────
  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function.
    // We call it when the component unmounts to avoid memory leaks.
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: User | null) => {
        if (firebaseUser) {
          // User is logged in — fetch their Firestore profile
          try {
            const profile = await getUserProfile(firebaseUser.uid);

            if (profile) {
              setUserProfile(profile);
            } else {
              // Profile doesn't exist yet (shouldn't happen normally,
              // but handles edge cases like manual Firestore deletion)
              setUserProfile(null);
            }
          } catch (error) {
            console.error("Failed to load user profile:", error);
            setUserProfile(null);
          }
        } else {
          // User is logged out
          setUserProfile(null);
        }

        // Auth state is now confirmed — hide loading screen
        setLoading(false);
      }
    );

    // Cleanup: stop listening when component unmounts
    return () => unsubscribe();
  }, []);

  // ── Context value ────────────────────────────────────────
  const value: AuthContextValue = {
    userProfile,
    loading,
    isAuthenticated: !!userProfile,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── 3. useAuth hook ──────────────────────────────────────
// The hook that components use to access auth state.
// Throws a helpful error if used outside AuthProvider.
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth() must be used inside an <AuthProvider>.\n" +
      "Make sure AuthProvider wraps your component tree."
    );
  }

  return context;
}
