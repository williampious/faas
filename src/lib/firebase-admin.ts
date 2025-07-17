// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// Check if the app is already initialized
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    // Validate that all required environment variables are present
    if (!privateKey || !clientEmail || !projectId) {
      throw new Error("Firebase Admin SDK credentials are not fully set in environment variables. Required: FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID.");
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        // The replace is crucial for parsing the private key from environment variables
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      // The storageBucket is needed for other potential admin operations
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log('[Firebase Admin] SDK initialized successfully.');

  } catch (error: any) {
      console.error(
        "CRITICAL ERROR: [Firebase Admin] SDK initialization failed. Server-side features will not work. Error: ", 
        error.message
    );
  }
}

// Export the initialized services
const adminDb = admin.apps.length ? admin.firestore() : undefined;
const adminAuth = admin.apps.length ? admin.auth() : undefined;
const adminApp = admin.apps.length ? admin.app() : undefined;

export { adminDb, adminAuth, adminApp };
