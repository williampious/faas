
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// This file is a standard server-side module. It should NOT have 'use server'.
// It initializes the Firebase Admin SDK once and exports the services for use
// in other server-side logic, such as Server Actions.

let app: admin.App | undefined;

/**
 * Initializes the Firebase Admin SDK if it hasn't been already.
 * This function is designed to be called before accessing any admin services.
 * It's a singleton pattern to prevent re-initialization.
 */
function initializeAdminApp() {
  if (admin.apps.length > 0) {
    app = admin.apps[0];
    return;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    // This will be caught by the getter functions below and thrown as an error.
    console.error(
        "[Firebase Admin] CRITICAL: 'FIREBASE_SERVICE_ACCOUNT_JSON' secret is MISSING. " +
        "The Admin SDK cannot be initialized. Please refer to the README.md for setup instructions."
    );
    return;
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
  }
}

/**
 * Getter for the Firestore Admin instance. Ensures the app is initialized.
 * @throws {Error} If the Firebase Admin App is not initialized.
 */
export const getAdminDb = (): admin.firestore.Firestore => {
  if (!app) {
    initializeAdminApp();
    if (!app) {
      throw new Error("Firebase Admin App is not initialized. Check server logs for configuration errors.");
    }
  }
  return admin.firestore(app);
};

/**
 * Getter for the Firebase Auth Admin instance. Ensures the app is initialized.
 * @throws {Error} If the Firebase Admin App is not initialized.
 */
export const getAdminAuth = (): admin.auth.Auth => {
  if (!app) {
    initializeAdminApp();
    if (!app) {
      throw new Error("Firebase Admin App is not initialized. Check server logs for configuration errors.");
    }
  }
  return admin.auth(app);
};
