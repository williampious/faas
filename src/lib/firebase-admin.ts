
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// This function ensures the Admin SDK is initialized only once.
function initializeAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    const existingApp = admin.apps[0];
    if (existingApp) {
      return existingApp;
    }
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
      if (error.code === 'auth/invalid-credential') {
        console.error('[Firebase Admin] SDK Initialization Failed: Invalid credentials. Please verify your FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, and FIREBASE_PROJECT_ID environment variables.');
      } else {
        console.error('[Firebase Admin] SDK initialization error via environment variables:', error);
      }
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

// These are now getters that ensure initialization before returning the service instance.
const getAdminDb = () => {
    const app = initializeAdminApp();
    return admin.firestore(app);
}

const getAdminAuth = () => {
    const app = initializeAdminApp();
    return admin.auth(app);
}

// We can still export the singleton app instance for direct use if needed.
const adminApp = initializeAdminApp();
const adminDb = getAdminDb();
const adminAuth = getAdminAuth();

export { adminDb, adminAuth, adminApp };
export default admin;
