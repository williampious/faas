
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let app: admin.app.App | undefined;

function initializeAdminApp() {
  if (admin.apps.length > 0) {
    app = admin.apps[0]!;
    return;
  }

  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (serviceAccountPath) {
    // This is the primary method for local development
    try {
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('[Firebase Admin] ✅ SDK initialized using GOOGLE_APPLICATION_CREDENTIALS.');
    } catch (e: any) {
      console.error(`[Firebase Admin] ❌ CRITICAL: Failed to initialize with file path: ${e.message}`);
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // This is the fallback for deployed environments like App Hosting
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('[Firebase Admin] ✅ SDK initialized using FIREBASE_SERVICE_ACCOUNT_JSON.');
    } catch (e: any) {
      console.error(`[Firebase Admin] ❌ CRITICAL: Failed to initialize with JSON secret: ${e.message}`);
    }
  } else {
    // No credentials found
    console.error("[Firebase Admin] ❌ CRITICAL: No admin credentials provided.");
  }
}

// Initialize on module load
initializeAdminApp();


export function getAdminDb() {
  if (!app) {
    // Attempt re-initialization as a last resort, which might now succeed if env vars loaded late.
    initializeAdminApp();
    if (!app) {
      throw new Error("Firebase Admin SDK is not initialized. Check server logs for configuration errors.");
    }
  }
  return admin.firestore(app);
}

export function getAdminAuth() {
  if (!app) {
    initializeAdminApp();
    if (!app) {
      throw new Error("Firebase Admin SDK is not initialized. Check server logs for configuration errors.");
    }
  }
  return admin.auth(app);
}
