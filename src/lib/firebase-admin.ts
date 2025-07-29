
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let app: admin.app.App | undefined;

function initializeAdminApp() {
  if (admin.apps.length > 0) {
    if (!app) app = admin.apps[0]!;
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
      "[Firebase Admin] ❌ CRITICAL ERROR: SDK initialization failed. This is likely due to a malformed service account JSON. Ensure the entire JSON content is copied correctly into the secret manager without extra formatting.",
      `Parser Error: ${error.message}`
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
