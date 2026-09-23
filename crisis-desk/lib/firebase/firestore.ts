// ============================================================
// Firestore Database Instance
//
// We initialize Firestore once here and export it.
// All database reads/writes import 'db' from this file.
// ============================================================

import { getFirestore, Firestore } from "firebase/firestore";
import app from "./config";

// Get the Firestore service tied to our initialized Firebase app
const db: Firestore = getFirestore(app);

export default db;
