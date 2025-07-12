

// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// Check if Firebase Admin SDK has already been initialized
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  const hasEnvVars = privateKey && clientEmail && projectId;
  const hasPlaceholders = 
    (projectId && projectId.includes("YOUR_PROJECT_ID")) ||
    (privateKey && privateKey.includes("YOUR_PRIVATE_KEY"));

  if (hasEnvVars && !hasPlaceholders) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          // Replace escaped newlines if the private key is stored as a single line in .env
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        storageBucket: storageBucket,
      });
      console.log('[Firebase Admin] SDK initialized successfully via environment variables.');
    } catch (error: any) {
      console.error('[Firebase Admin] SDK initialization error via environment variables:', error.message);
      if (error.code === 'app/duplicate-app') {
         console.warn('[Firebase Admin] SDK already initialized (caught duplicate app error).');
      } else {
        console.error('[Firebase Admin] Detailed SDK initialization error:', error);
      }
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
        admin.initializeApp({
            storageBucket: storageBucket
        }); // Tries to initialize using GOOGLE_APPLICATION_CREDENTIALS
        console.log('[Firebase Admin] SDK initialized successfully using GOOGLE_APPLICATION_CREDENTIALS.');
    } catch (error: any) {
        console.error('[Firebase Admin] SDK initialization error using GOOGLE_APPLICATION_CREDENTIALS:', error.message);
    }
  } else {
    console.warn(
        "🛑 [Firebase Admin] SDK credentials not set. Server-side features like user migration will fail. " +
        "Please ensure `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` are correctly set " +
        "in your hosting environment's server variables and that placeholder values are replaced."
    );
  }
}

let adminDbInstance: admin.firestore.Firestore | null = null;
let adminAuthInstance: admin.auth.Auth | null = null;

if (admin.apps.length > 0 && admin.apps[0]) { // Check if an app was successfully initialized
    try {
        adminDbInstance = admin.firestore();
        adminAuthInstance = admin.auth();
    } catch (e: any) {
        console.error("[Firebase Admin] Error getting Firestore/Auth instances:", e);
    }
}


export const adminDb = adminDbInstance; // This will be your admin Firestore instance
export const adminAuth = adminAuthInstance;
export default admin; // Export the initialized admin SDK itself if needed
