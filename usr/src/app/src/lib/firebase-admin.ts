
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// This file is a standard server-side module. It should NOT have 'use server'.
// It initializes the Firebase Admin SDK once and exports the services for use
// in other server-side logic, such as Server Actions.

let app: admin.App | undefined;

function initializeAdminApp() {
  // This function is designed to be idempotent (safe to call multiple times).
  if (admin.apps.length > 0) {
    if (!app) {
      app = admin.apps[0]!;
    }
    return;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      "CRITICAL: 'FIREBASE_SERVICE_ACCOUNT_JSON' secret is MISSING. " +
      "The Admin SDK cannot be initialized. Please refer to the README.md for setup instructions."
    );
  }

  try {
    // This sanitization is crucial. Environment variables can misinterpret
    // newline characters within the private_key, breaking JSON parsing.
    // This regex replaces any actual newline and carriage return characters with their escaped versions.
    const sanitizedServiceAccountJson = serviceAccountJson.replace(/\\n/g, '\\\\n').replace(/\r/g, '');
    const serviceAccount = JSON.parse(sanitizedServiceAccountJson);
    
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('[Firebase Admin] ✅ SDK initialized successfully.');
  } catch (error: any) {
    throw new Error(
      "CRITICAL ERROR: SDK initialization failed. This is likely due to a malformed service account JSON. " +
      `Error: ${error.message}`
    );
  }
}

// Call the initialization function immediately on module load.
initializeAdminApp();

// Export the initialized services directly.
// If initialization failed, `app` will be undefined, and these will throw an error upon access,
// which is the desired behavior to signal a critical configuration issue.
export const adminDb = app ? admin.firestore(app) : undefined;
export const adminAuth = app ? admin.auth(app) : undefined;

/**
 * A helper function to get the initialized Firestore instance.
 * Throws a clear error if the Admin SDK is not initialized.
 * This is the recommended way to access the DB from server actions.
 */
export function getAdminDb() {
  if (!adminDb) {
    // Attempt re-initialization if db is not available, as a fallback.
    initializeAdminApp();
    if(!adminDb) {
      throw new Error("Firebase Admin App is not initialized. Check server logs for configuration errors.");
    }
  }
  return adminDb;
}
