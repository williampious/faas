
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let app: admin.app.App | undefined;

function initializeAdminApp() {
  if (admin.apps.length > 0) {
    app = admin.apps[0]!;
    // console.log('[Firebase Admin] ✅ Using existing SDK instance.'); // This can be noisy, commenting out for now.
    return;
  }

  // This function now relies on the calling context (like a server action)
  // to have already loaded environment variables using `dotenv.config()`.
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountPath) {
    try {
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('[Firebase Admin] ✅ SDK initialized using GOOGLE_APPLICATION_CREDENTIALS.');
    } catch (e: any) {
      console.error(`[Firebase Admin] ❌ CRITICAL: Failed to initialize with file path: ${e.message}`);
    }
  } else if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('[Firebase Admin] ✅ SDK initialized using FIREBASE_SERVICE_ACCOUNT_JSON.');
    } catch (e: any)      {
      console.error(
        "[Firebase Admin] ❌ CRITICAL ERROR: SDK initialization failed. This is likely due to a malformed service account JSON. ",
        e.message
      );
    }
  } else {
    // This state is now expected if no action has pre-loaded the env vars.
    // The error will be thrown by getAdminDb() if it's called without initialization.
  }
}

// Initialize on first module load
initializeAdminApp();

export function getAdminDb() {
  if (!app) {
    // Attempt re-initialization as a last resort. This might now succeed
    // if the calling function has loaded the env vars.
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
