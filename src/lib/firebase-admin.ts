
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// This file is a standard server-side module. It should NOT have 'use server'.
// It initializes the Firebase Admin SDK once and exports the services for use
// in other server-side logic, such as Server Actions.

let app: admin.App | undefined = undefined;
let db: admin.firestore.Firestore | undefined = undefined;
let auth: admin.auth.Auth | undefined = undefined;

function initializeAdminApp() {
  if (admin.apps.length > 0) {
    app = admin.app();
    console.log('[Firebase Admin] Using existing SDK instance.');
  } else {
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
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // Use server-side variable
      });
      console.log('[Firebase Admin] ✅ SDK initialized successfully.');
    } catch (error: any) {
      console.error(
        "[Firebase Admin] ❌ CRITICAL ERROR: SDK initialization failed. This is likely due to a malformed service account JSON.",
        error.message
      );
      throw new Error("Firebase Admin SDK could not be initialized.");
    }
  }

  db = admin.firestore(app);
  auth = admin.auth(app);
}

// Lazy initialization: the app is only initialized when a service is first requested.
// This is a robust pattern for serverless environments.
function getAdminDb() {
  if (!db) {
    initializeAdminApp();
  }
  // The '!' asserts that after initializeAdminApp, db will be defined.
  // The function throws an error if it fails, so this is a safe assumption.
  return db!;
}

function getAdminAuth() {
  if (!auth) {
    initializeAdminApp();
  }
  return auth!;
}

export const adminDb = getAdminDb();
export const adminAuth = getAdminAuth();
