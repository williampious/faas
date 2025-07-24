
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// This file is a standard server-side module. It should NOT have 'use server'.
// It initializes the Firebase Admin SDK once and exports the services for use
// in other server-side logic, such as Server Actions.

let app: admin.App | undefined = undefined;
let db: admin.firestore.Firestore | undefined = undefined;
let auth: admin.auth.Auth | undefined = undefined;

function initializeAdminApp(): boolean {
  if (admin.apps.length > 0) {
    app = admin.app();
    db = admin.firestore(app);
    auth = admin.auth(app);
    return true;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.error(
      "[Firebase Admin] CRITICAL: 'FIREBASE_SERVICE_ACCOUNT_JSON' secret is MISSING. " +
      "The Admin SDK cannot be initialized. Please refer to the README.md for setup instructions."
    );
    return false; // Fail gracefully
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('[Firebase Admin] ✅ SDK initialized successfully.');
    db = admin.firestore(app);
    auth = admin.auth(app);
    return true;
  } catch (error: any) {
    console.error(
      "[Firebase Admin] ❌ CRITICAL ERROR: SDK initialization failed. This is likely due to a malformed service account JSON.",
      error.message
    );
    return false; // Fail gracefully
  }
}

// Ensure initialization is attempted only once
const isInitialized = initializeAdminApp();

export const adminDb = isInitialized ? db : undefined;
export const adminAuth = isInitialized ? auth : undefined;
