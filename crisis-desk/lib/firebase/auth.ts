// ============================================================
// Firebase Authentication Instance
//
// We initialize the Auth service once here and export it.
// All auth operations (login, logout, register) import from
// this file — never re-initialize Firebase Auth elsewhere.
// ============================================================

import { getAuth, Auth } from "firebase/auth";
import app from "./config";

// Get the Auth service tied to our initialized Firebase app
const auth: Auth = getAuth(app);

export default auth;
