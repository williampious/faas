
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let app: admin.app.App | undefined;

function initializeAdminApp() {
  // If the app is already initialized, do nothing.
  if (admin.apps.length > 0) {
    app = admin.apps[0]!;
    return;
  }

  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountPath) {
    // Ideal for local development: use the file path.
    try {
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('[Firebase Admin] ✅ SDK initialized using GOOGLE_APPLICATION_CREDENTIALS file path.');
    } catch (e: any) {
      console.error(`[Firebase Admin] ❌ CRITICAL: Failed to initialize with file path: ${e.message}`);
      throw new Error(`Firebase Admin SDK initialization failed: ${e.message}`);
    }
  } else if (serviceAccountJson) {
    // Necessary for deployed environments like App Hosting.
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('[Firebase Admin] ✅ SDK initialized using FIREBASE_SERVICE_ACCOUNT_JSON secret.');
    } catch (e: any) {
      console.error("--- DEBUG: FAILED TO PARSE SERVICE ACCOUNT JSON ---");
      console.error("The string provided in the FIREBASE_SERVICE_ACCOUNT_JSON secret is not valid JSON. This can be due to formatting errors or incorrect escaping of characters like newlines.");
      console.error("Parser Error:", e.message);
      console.error("--- END DEBUG ---");
      throw new Error(`Firebase Admin SDK initialization failed due to malformed JSON: ${e.message}`);
    }
  } else {
    // Critical configuration error if neither is set.
    const errorMsg = "[Firebase Admin] ❌ CRITICAL: Neither GOOGLE_APPLICATION_CREDENTIALS nor FIREBASE_SERVICE_ACCOUNT_JSON is set. The Admin SDK cannot be initialized.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * A helper function to get the initialized Firestore instance.
 * Ensures the Admin SDK is initialized before returning the instance.
 */
export function getAdminDb() {
  initializeAdminApp();
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
  initializeAdminApp();
  if (!app) {
    throw new Error("Firebase Admin SDK is not initialized. Check server logs for configuration errors.");
  }
  return admin.auth(app);
}
