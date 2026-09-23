// ============================================================
// Firebase Error Messages — lib/utils/firebase-errors.ts
//
// Firebase throws error codes like "auth/user-not-found".
// These are not user-friendly. This function converts them
// into plain English messages that users can understand.
// ============================================================

/**
 * Converts a Firebase Auth error code into a human-readable
 * message. Falls back to a generic message for unknown codes.
 */
export function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    // ── Login errors ────────────────────────────────────────
    "auth/user-not-found":
      "No account found with this email address.",
    "auth/wrong-password":
      "Incorrect password. Please try again.",
    "auth/invalid-credential":
      "Invalid email or password. Please check and try again.",
    "auth/invalid-email":
      "Please enter a valid email address.",
    "auth/user-disabled":
      "This account has been disabled. Contact your administrator.",
    "auth/too-many-requests":
      "Too many failed attempts. Please wait a moment and try again.",

    // ── Registration errors ──────────────────────────────────
    "auth/email-already-in-use":
      "An account with this email already exists. Try signing in instead.",
    "auth/weak-password":
      "Password is too weak. Use at least 8 characters.",
    "auth/operation-not-allowed":
      "This sign-in method is not enabled. Contact your administrator.",

    // ── Google sign-in errors ────────────────────────────────
    "auth/popup-closed-by-user":
      "Sign-in was cancelled. Please try again.",
    "auth/popup-blocked":
      "Sign-in popup was blocked by your browser. Please allow popups and try again.",
    "auth/cancelled-popup-request":
      "Sign-in was cancelled.",
    "auth/account-exists-with-different-credential":
      "An account already exists with this email using a different sign-in method.",

    // ── Network errors ───────────────────────────────────────
    "auth/network-request-failed":
      "Network error. Please check your connection and try again.",

    // ── Generic ──────────────────────────────────────────────
    "auth/internal-error":
      "An internal error occurred. Please try again.",
  };

  return (
    messages[code] ??
    "Something went wrong. Please try again or contact support."
  );
}
