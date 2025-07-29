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
      // If the app was initialized elsewhere (e.g., during testing or in another module),
      // ensure our 'app' variable references it.
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
    // The environment variable MUST be a properly escaped JSON string.
    // The JSON.parse function will correctly handle the '\\n' sequences in the private_key.
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('[Firebase Admin] ✅ SDK initialized successfully.');
  } catch (error: any) {
    console.error("--- DEBUG: FAILED TO PARSE SERVICE ACCOUNT JSON ---");
    console.error("The string provided in the FIREBASE_SERVICE_ACCOUNT_JSON secret is not valid JSON.");
    console.error("Parser Error:", error.message);
    console.error("--- END DEBUG ---");
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
    // Attempt re-initialization as a last resort, but primarily
    // ensure initial setup is correct.
    initializeAdminApp(); 
    if(!adminDb) { // Check again after attempt
      throw new Error("Firebase Admin SDK for Firestore is not initialized. Please ensure FIREBASE_SERVICE_ACCOUNT_JSON is correctly set and try again.");
    }
  }
  return adminDb;
}

export function getAdminAuth() {
  if (!adminAuth) {
    initializeAdminApp(); // Attempt re-initialization for Auth too
    if(!adminAuth) {
      throw new Error("Firebase Admin SDK for Auth is not initialized. Please ensure FIREBASE_SERVICE_ACCOUNT_JSON is correctly set and try again.");
    }
  }
  return adminAuth;
}
