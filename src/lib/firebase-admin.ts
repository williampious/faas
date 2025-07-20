// src/lib/firebase-admin.ts

import * as admin from 'firebase-admin';

// This file is marked with 'use server', so it will only ever run on the server.
// This is the single, definitive initialization of the Firebase Admin SDK.

let app;

if (!admin.apps.length) {
  try {
    // This simplified initialization allows Firebase to automatically find the
    // default credentials provided by the Google Cloud environment (like App Hosting).
    // It will fall back to GOOGLE_APPLICATION_CREDENTIALS env var if set.
    app = admin.initializeApp({
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
