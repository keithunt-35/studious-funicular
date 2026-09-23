// ============================================================
// Firebase Storage Instance
//
// Used for uploading incident photos/attachments.
// We initialize Storage once here and export it.
// ============================================================

import { getStorage, FirebaseStorage } from "firebase/storage";
import app from "./config";

// Get the Storage service tied to our initialized Firebase app
const storage: FirebaseStorage = getStorage(app);

export default storage;
