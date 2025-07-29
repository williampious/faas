// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let app: admin.app.App | undefined;

// Initialization function that will be called on demand
function ensureAdminAppInitialized() {
  // If app is already initialized, do nothing
  if (admin.apps.length > 0) {
    app = admin.apps[0]!;
    return;
  }

  // Proceed with initialization if no existing app
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountPath) {
    try {
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('[Firebase Admin] ✅ SDK initialized using GOOGLE_APPLICATION_CREDENTIALS (lazy init).');
    } catch (e: any) {
      console.error(`[Firebase Admin] ❌ CRITICAL: Failed to initialize with file path (lazy init): ${e.message}`);
      throw new Error(`Firebase Admin SDK initialization failed: ${e.message}`); // Throw error if initialization fails
    }
  } else if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('[Firebase Admin] ✅ SDK initialized using FIREBASE_SERVICE_ACCOUNT_JSON (lazy init).');
    } catch (e: any) {
      console.error(
        "[Firebase Admin] ❌ CRITICAL ERROR: SDK initialization failed with JSON secret (lazy init). ",
        e.message
      );
      throw new Error(`Firebase Admin SDK initialization failed: ${e.message}`); // Throw error if initialization fails
    }
  } else {
    const errorMsg = "[Firebase Admin] ❌ CRITICAL: Neither GOOGLE_APPLICATION_CREDENTIALS nor FIREBASE_SERVICE_ACCOUNT_JSON is set. The Admin SDK cannot be initialized.";
    console.error(errorMsg);
    throw new Error(errorMsg); // Throw error if no credentials
  }
}

export function getAdminDb() {
  ensureAdminAppInitialized(); // Ensure initialization happens before returning db
  if (!app) {
       // This should ideally not happen if ensureAdminAppInitialized throws on failure,
       // but as a safeguard:
       throw new Error("Firebase Admin SDK for Firestore is not initialized. SDK initialization likely failed.");
  }
  return admin.firestore(app);
}

export function getAdminAuth() {
  ensureAdminAppInitialized(); // Ensure initialization happens before returning auth
    if (!app) {
       // This should ideally not happen if ensureAdminAppInitialized throws on failure,
       // but as a safeguard:
       throw new Error("Firebase Admin SDK for Auth is not initialized. SDK initialization likely failed.");
    }
  return admin.auth(app);
}
