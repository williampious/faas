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
    if (!app) { // Ensure app instance is assigned if already initialized
        app = admin.apps[0];
        db = admin.firestore(app);
        auth = admin.auth(app);
    }
    return;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    // This will be caught by getAdminDb/getAdminAuth and returned as a user-friendly error
    return;
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
  } catch (error: any) {
    console.error(
      "[Firebase Admin] ❌ CRITICAL ERROR: SDK initialization failed. This is likely due to a malformed service account JSON.",
      error.message
    );
    // Let app remain undefined
  }
}

// Call initialization on module load
initializeAdminApp();

function getAdminDb() {
    if (!db) {
        throw new Error("[Firebase Admin] CRITICAL: Firestore is not available. The Admin SDK may have failed to initialize due to missing secrets (FIREBASE_SERVICE_ACCOUNT_JSON). Check server logs.");
    }
    return db;
}

function getAdminAuth() {
    if (!auth) {
        throw new Error("[Firebase Admin] CRITICAL: Auth is not available. The Admin SDK may have failed to initialize due to missing secrets (FIREBASE_SERVICE_ACCOUNT_JSON). Check server logs.");
    }
    return auth;
}

export const adminDb = getAdminDb();
export const adminAuth = getAdminAuth();
