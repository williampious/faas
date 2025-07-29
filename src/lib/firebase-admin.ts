// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let app: admin.app.App | undefined;

function initializeAdminApp() {
  // This function is designed to be idempotent (safe to call multiple times).
  if (admin.apps.length > 0) {
    if (!app) {
      app = admin.apps[0]!;
    }
    return;
  }

  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  try {
    if (serviceAccountPath) {
      // Prioritize GOOGLE_APPLICATION_CREDENTIALS for local development
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('[Firebase Admin] ✅ SDK initialized successfully using GOOGLE_APPLICATION_CREDENTIALS.');
    } else if (serviceAccountJson) {
      // Fallback to FIREBASE_SERVICE_ACCOUNT_JSON for deployed environments
      const serviceAccount = JSON.parse(serviceAccountJson);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('[Firebase Admin] ✅ SDK initialized successfully using FIREBASE_SERVICE_ACCOUNT_JSON.');
    } else {
      throw new Error("Neither GOOGLE_APPLICATION_CREDENTIALS nor FIREBASE_SERVICE_ACCOUNT_JSON is set.");
    }
  } catch (error: any) {
    console.error(
      "[Firebase Admin] ❌ CRITICAL ERROR: SDK initialization failed.",
      error.message
    );
    // Let app remain undefined so subsequent calls will fail clearly.
  }
}

// Call the initialization function immediately on module load.
initializeAdminApp();

// Export helper functions that ensure the app is initialized before returning services.
export function getAdminDb() {
  if (!app) {
    throw new Error("Firebase Admin SDK is not initialized. Check server logs for configuration errors.");
  }
  return admin.firestore(app);
}

export function getAdminAuth() {
  if (!app) {
    throw new Error("Firebase Admin SDK is not initialized. Check server logs for configuration errors.");
  }
  return admin.auth(app);
}
