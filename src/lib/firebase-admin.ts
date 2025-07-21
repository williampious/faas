// src/lib/firebase-admin.ts

import * as admin from 'firebase-admin';

// This file is marked with 'use server', so it will only ever run on the server.
// This is the single, definitive initialization of the Firebase Admin SDK.

let app: admin.App | undefined;

// A function to check if the required environment variables are present and look valid.
const checkEnvVars = () => {
  const requiredVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error(
      `CRITICAL ERROR: [Firebase Admin] The following required server-side environment variables are missing: ${missingVars.join(', ')}. The Admin SDK will not be initialized.`
    );
    return false;
  }
  if (!process.env.FIREBASE_PRIVATE_KEY!.startsWith('-----BEGIN PRIVATE KEY-----')) {
    console.error(
      "CRITICAL ERROR: [Firebase Admin] The 'FIREBASE_PRIVATE_KEY' environment variable appears to be invalid. It should start with '-----BEGIN PRIVATE KEY-----'. Please ensure the entire key, including the header and footer lines, is copied correctly."
    );
    return false;
  }
  return true;
};

const hasValidEnv = checkEnvVars();

if (!admin.apps.length) {
  if (hasValidEnv) {
    try {
      // For environments like Vercel or local dev with .env.local
      // this relies on the env vars being set.
      // For App Hosting, these are injected from Secret Manager.
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('[Firebase Admin] SDK initialized successfully.');
    } catch (error: any) {
      console.error(
        "CRITICAL ERROR: [Firebase Admin] SDK initialization failed despite environment variables being present. Error: ", 
        error.message,
        "This usually happens if the environment variables contain typos or are not properly formatted."
      );
    }
  } else {
    console.error("[Firebase Admin] Skipping initialization due to missing or invalid environment variables.");
  }
} else {
  app = admin.apps[0];
  if(app) {
    console.log('[Firebase Admin] SDK already initialized.');
  } else {
    // This case should be rare, but handles if admin.apps has a null/undefined entry
    console.error('[Firebase Admin] admin.apps has entries but the first one is not a valid App object. Re-initialization may be required.');
  }
}

// Export the initialized services. They will be undefined if initialization failed.
const adminDb = app ? admin.firestore() : undefined;
const adminAuth = app ? admin.auth() : undefined;

export { adminDb, adminAuth };
