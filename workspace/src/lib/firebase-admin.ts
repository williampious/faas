
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// This file is a standard server-side module. It should NOT have 'use server'.
// It initializes the Firebase Admin SDK once and exports the services for use
// in other server-side logic, such as Server Actions.

let app: admin.App | undefined;
let db: admin.firestore.Firestore | undefined;
let auth: admin.auth.Auth | undefined;

function initializeAdminApp() {
  if (admin.apps.length > 0) {
    app = admin.apps[0];
  } else {
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
      // Let app remain undefined
    }
  }

  if (app) {
    db = admin.firestore(app);
    auth = admin.auth(app);
  }
}

// Initialize on module load
initializeAdminApp();

export const adminDb = db;
export const adminAuth = auth;
