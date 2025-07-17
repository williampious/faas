
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;
let adminApp: admin.app.App;

// This function ensures the Admin SDK is initialized only once.
function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  
  const hasEnvVars = privateKey && clientEmail && projectId;
  const hasPlaceholders = 
    (projectId && projectId.includes("YOUR_PROJECT_ID")) ||
    (privateKey && privateKey.includes("YOUR_PRIVATE_KEY"));

  if (hasEnvVars && !hasPlaceholders) {
    try {
      const app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('[Firebase Admin] SDK initialized successfully via environment variables.');
      return app;
    } catch (error: any) {
      console.error('[Firebase Admin] SDK initialization error via environment variables:', error);
      throw error; // Re-throw to indicate failure
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const app = admin.initializeApp({
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
      console.log('[Firebase Admin] SDK initialized successfully using GOOGLE_APPLICATION_CREDENTIALS.');
      return app;
    } catch (error: any) {
      console.error('[Firebase Admin] SDK initialization error using GOOGLE_APPLICATION_CREDENTIALS:', error);
      throw error;
    }
  } else {
    console.error(
        "CRITICAL ERROR: [Firebase Admin] SDK credentials not set. Server-side features will fail. " +
        "Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` in your hosting environment."
    );
    throw new Error("Firebase Admin SDK not initialized. Missing credentials.");
  }
}

// Initialize and export the services.
try {
    adminApp = getAdminApp();
    adminDb = admin.firestore(adminApp);
    adminAuth = admin.auth(adminApp);
} catch (e) {
    console.error("Failed to initialize Firebase Admin services.", e);
    // Set to null/undefined or handle the error as appropriate for your app's startup.
    // @ts-ignore
    adminApp = null;
    // @ts-ignore
    adminDb = null;
    // @ts-ignore
    adminAuth = null;
}


export { adminDb, adminAuth, adminApp };
export default admin;
