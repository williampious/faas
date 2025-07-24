
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// This file is a standard server-side module. It should NOT have 'use server'.
// It initializes the Firebase Admin SDK once and exports the services for use
// in other server-side logic, such as Server Actions.

let app: admin.App | undefined;

function initializeAdminApp() {
  if (admin.apps.length > 0) {
    app = admin.apps[0];
    return;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      "[Firebase Admin] CRITICAL: 'FIREBASE_SERVICE_ACCOUNT_JSON' secret is MISSING. " +
      "The Admin SDK cannot be initialized. Please refer to the README.md for setup instructions."
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('[Firebase Admin] ✅ SDK initialized successfully.');
  } catch (error: any) {
    console.error(
      "[Firebase Admin] ❌ CRITICAL ERROR: SDK initialization failed. This is likely due to a malformed service account JSON.",
      error.message
    );
    throw new Error(`[Firebase Admin] Failed to initialize: ${error.message}`);
  }
}

// Call initialization on module load. This ensures it runs once when the server starts.
initializeAdminApp();

// Export initialized services. If initialization failed, these will be undefined and will cause
// any server action that uses them to fail with a clear "undefined" error, pointing back to the init failure.
export const adminDb = app ? admin.firestore(app) : undefined;
export const adminAuth = app ? admin.auth(app) : undefined;

