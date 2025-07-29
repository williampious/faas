// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let app: admin.app.App | undefined;

function initializeAdminApp() {
  // This function is designed to be idempotent (safe to call multiple times).
  if (admin.apps.length > 0) {
    if (!app) app = admin.apps[0]!;
    return;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    // This will be caught by getAdminDb/getAdminAuth and returned as a user-friendly error
    console.error("[Firebase Admin] CRITICAL: 'FIREBASE_SERVICE_ACCOUNT_JSON' secret is MISSING. Admin SDK cannot be initialized.");
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
    // Let app remain undefined so getAdminDb fails explicitly
  }
}

/**
 * A helper function to get the initialized Firestore instance.
 * Ensures the Admin SDK is initialized before returning the instance.
 */
export function getAdminDb() {
  if (!app) initializeAdminApp();
  if (!app) {
    throw new Error("Firebase Admin SDK is not initialized. Check server logs for configuration errors.");
  }
  return admin.firestore(app);
}

/**
 * A helper function to get the initialized Auth instance.
 * Ensures the Admin SDK is initialized before returning the instance.
 */
export function getAdminAuth() {
  if (!app) initializeAdminApp();
  if (!app) {
    throw new Error("Firebase Admin SDK is not initialized. Check server logs for configuration errors.");
  }
  return admin.auth(app);
}
