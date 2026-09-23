// ============================================================
// Firebase Configuration & App Initialization
//
// This file reads your Firebase credentials from environment
// variables and initializes the Firebase app.
//
// IMPORTANT: All NEXT_PUBLIC_ variables are safe to expose
// in the browser — Firebase keys are NOT secret keys.
// Security is enforced by Firestore Security Rules instead.
// ============================================================

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";

// These values come from your .env.local file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// getApps() check prevents re-initializing during hot reload in development.
// If the app is already initialized, we reuse it instead of creating a new one.
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export default app;
