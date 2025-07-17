// src/lib/firebase-admin.ts
'use server';

import * as admin from 'firebase-admin';

// This file is marked with 'use server', so it will only ever run on the server.
// This is the single, definitive initialization of the Firebase Admin SDK.

let app;

if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
      throw new Error("Firebase Admin SDK credentials are not fully set in environment variables.");
    }

    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log('[Firebase Admin] SDK initialized successfully.');

  } catch (error: any) {
    console.error(
      "CRITICAL ERROR: [Firebase Admin] SDK initialization failed. Server-side features will not work. Error: ", 
      error.message
    );
    // In a server environment, if this fails, subsequent calls will likely fail too.
    // We let it proceed so the error is logged, but the services will be undefined.
  }
} else {
  app = admin.apps[0];
  console.log('[Firebase Admin] SDK already initialized.');
}

// Export the initialized services. They will be undefined if initialization failed.
const adminDb = app ? admin.firestore() : undefined;
const adminAuth = app ? admin.auth() : undefined;
const adminApp = app;

export { adminDb, adminAuth, adminApp };
