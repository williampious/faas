// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// Check if Firebase Admin SDK has already been initialized
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (privateKey && clientEmail && projectId && projectId !== "YOUR_PROJECT_ID_FROM_SERVICE_ACCOUNT") {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          // Replace escaped newlines if the private key is stored as a single line in .env
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        // databaseURL: `https://${projectId}.firebaseio.com` // Optional: if using Realtime Database
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error: any) {
      console.error('Firebase Admin SDK initialization error:', error.message);
      if (error.code === 'app/duplicate-app') {
         console.warn('Firebase Admin SDK already initialized (caught duplicate app error).');
      } else {
        console.error('Detailed Firebase Admin SDK initialization error:', error);
      }
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
        admin.initializeApp(); // Tries to initialize using GOOGLE_APPLICATION_CREDENTIALS
        console.log('Firebase Admin SDK initialized successfully using GOOGLE_APPLICATION_CREDENTIALS.');
    } catch (error: any) {
        console.error('Firebase Admin SDK initialization error using GOOGLE_APPLICATION_CREDENTIALS:', error.message);
    }
  } else {
    console.warn(
        "Firebase Admin SDK credentials are not fully set in .env (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) " +
        "and GOOGLE_APPLICATION_CREDENTIALS is not set. Admin SDK features will not be available. " +
        "Ensure placeholder values are replaced."
    );
  }
} else {
    console.log("Firebase Admin SDK already initialized.");
}

let adminDbInstance = null;
let adminAuthInstance = null;

if (admin.apps.length > 0 && admin.apps[0]) { // Check if an app was successfully initialized
    try {
        adminDbInstance = admin.firestore();
        adminAuthInstance = admin.auth();
    } catch (e) {
        console.error("Error getting admin Firestore/Auth instances:", e);
    }
}


export const adminDb = adminDbInstance; // This will be your admin Firestore instance
export const adminAuth = adminAuthInstance;
export default admin; // Export the initialized admin SDK itself if needed
