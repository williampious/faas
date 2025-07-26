
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
    console.error(
        "[Firebase Admin] CRITICAL: 'FIREBASE_SERVICE_ACCOUNT_JSON' secret is MISSING. " +
        "The Admin SDK cannot be initialized. Please refer to the README.md for setup instructions."
    );
    return; // Do not throw, let the getters handle the undefined app state
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
    // Let app remain undefined
  }
}

// Call initialization on module load as a first attempt.
initializeAdminApp();

// Export getters that ensure initialization before returning the service
export const getAdminDb = (): admin.firestore.Firestore => {
    if (!app) {
        initializeAdminApp(); // Attempt to re-initialize if app is not available
        if (!app) {
            throw new Error("Firebase Admin App is not initialized. Check server logs for configuration errors.");
        }
    }
    return admin.firestore(app);
};

export const getAdminAuth = (): admin.auth.Auth => {
    if (!app) {
        initializeAdminApp(); // Attempt to re-initialize
        if (!app) {
            throw new Error("Firebase Admin App is not initialized. Check server logs for configuration errors.");
        }
    }
    return admin.auth(app);
};

// For backward compatibility, export potentially undefined instances.
// The getters are the preferred and safer way to access the services.
export const adminDb = app ? getAdminDb() : undefined;
export const adminAuth = app ? getAdminAuth() : undefined;
