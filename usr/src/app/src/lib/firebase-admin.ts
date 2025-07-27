// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// This file is a standard server-side module. It should NOT have 'use server'.
// It initializes the Firebase Admin SDK once and exports the services for use
// in other server-side logic, such as Server Actions.

let app: admin.App | undefined;
let db: admin.firestore.Firestore | undefined;
let auth: admin.auth.Auth | undefined;

function initializeAdminApp() {
  // This function is designed to be idempotent (safe to call multiple times).
  if (admin.apps.length > 0) {
    if (!app) {
      app = admin.apps[0]!;
      db = admin.firestore(app);
      auth = admin.auth(app);
    }
    return;
  }

  try {
    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
      throw new Error(
        "CRITICAL: 'FIREBASE_SERVICE_ACCOUNT_JSON' secret is MISSING. " +
        "The Admin SDK cannot be initialized. Please refer to the README.md for setup instructions."
      );
    }

    // --- DEBUG: Inspect the Raw Environment Variable Content ---
    console.log("--- DEBUG: Raw Service Account JSON from ENV ---");
    console.log(serviceAccountJson);
    console.log("--- END DEBUG ---");
    
    // Replace actual newline characters with their JSON-escaped representation '\\n'.
    // Also, handle carriage returns by removing them.
    serviceAccountJson = serviceAccountJson.replace(/\n/g, '\\n').replace(/\r/g, '');

    const serviceAccount = JSON.parse(serviceAccountJson);
    
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    db = admin.firestore(app);
    auth = admin.auth(app);
    
    console.log('[Firebase Admin] ✅ SDK initialized successfully.');
  } catch (error: any) {
    throw new Error(
      "CRITICAL ERROR: SDK initialization failed. This is likely due to a malformed service account JSON. " +
      `Error: ${error.message}`
    );
  }
}

// Initialize on module load
initializeAdminApp();

export { adminDb, adminAuth };
