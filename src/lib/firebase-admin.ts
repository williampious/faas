// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// This file is a standard server-side module. It should NOT have 'use server'.
// It initializes the Firebase Admin SDK once and exports the services for use
// in other server-side logic, such as Server Actions.

let app: admin.app.App | undefined;
let db: admin.firestore.Firestore | undefined;
let auth: admin.auth.Auth | undefined;

function initializeAdminApp() {
  if (admin.apps.length > 0) {
    if (!app) {
      app = admin.apps[0]!;
      db = admin.firestore(app);
      auth = admin.auth(app);
    }
    return;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error(
      "CRITICAL: 'FIREBASE_SERVICE_ACCOUNT_JSON' secret is MISSING. " +
      "The Admin SDK cannot be initialized. Please refer to the README.md for setup instructions."
    );
  }

  try {
    // This is the key fix: it ensures that newline characters in the JSON
    // string from the environment variable are correctly parsed.
    const serviceAccount = JSON.parse(
      serviceAccountJson.replace(/\\n/g, '\n')
    );
    
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    db = admin.firestore(app);
    auth = admin.auth(app);
    
    console.log('[Firebase Admin] ✅ SDK initialized successfully.');
  } catch (error: any) {
    throw new Error(
      "CRITICAL ERROR: SDK initialization failed. This is likely due to a malformed service account JSON. " +
      `Error: ${error.message}`
    );
  }
}

// Initialize on module load and export the initialized services.
initializeAdminApp();

function getAdminDb() {
  if (!db) {
    throw new Error("Firebase Admin SDK is not initialized. Check server logs for configuration errors.");
  }
  return db;
}

function getAdminAuth() {
  if (!auth) {
    throw new Error("Firebase Admin SDK is not initialized. Check server logs for configuration errors.");
  }
  return auth;
}

export { getAdminDb, getAdminAuth };
