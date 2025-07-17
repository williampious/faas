// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;
let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

try {
  if (admin.apps.length > 0 && admin.apps[0]) {
    adminApp = admin.apps[0];
  } else {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
      throw new Error("Firebase Admin SDK credentials (private key, client email, project ID) are not set in environment variables.");
    }
    
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log('[Firebase Admin] SDK initialized successfully.');
  }
  
  adminDb = admin.firestore(adminApp);
  adminAuth = admin.auth(adminApp);

} catch (error: any) {
    console.error(
        "CRITICAL ERROR: [Firebase Admin] SDK initialization failed. Server-side features will not work. Error: ", 
        error.message
    );
    // In case of error, we assign null to prevent crashes on import, but functions will fail.
    // @ts-ignore
    adminDb = null;
    // @ts-ignore
    adminAuth = null;
}

export { adminDb, adminAuth, adminApp };
