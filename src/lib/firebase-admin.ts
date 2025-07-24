
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// This file is a standard server-side module. It should NOT have 'use server'.
// It initializes the Firebase Admin SDK once and exports the services for use
// in other server-side logic, such as Server Actions.

let app: admin.App;

if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.error(`
      ===============================================================
      [Firebase Admin] ❌ CRITICAL: The 'FIREBASE_SERVICE_ACCOUNT_JSON' secret is MISSING.
      
      This is the most common and critical configuration error. The Admin SDK cannot
      initialize without it, and server-side features like user invitations and
      subscription activations will fail.

      ACTION REQUIRED:
      1. Go to your Firebase Project Settings -> Service accounts -> Generate new private key.
      2. A JSON file will be downloaded. Open it and copy the ENTIRE content.
      3. Go to your hosting provider's secret manager (e.g., Google Cloud Secret Manager).
      4. Create a new secret with the EXACT name 'FIREBASE_SERVICE_ACCOUNT_JSON'.
      5. Paste the entire content of the JSON file as the secret's value.
      6. IMPORTANT: You MUST redeploy your application for the new secret to be loaded.
      7. Refer to the README.md file for a detailed, step-by-step guide.
      ===============================================================
    `);
  } else {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('[Firebase Admin] ✅ SDK initialized successfully.');
    } catch (error: any) {
      console.error(
        "[Firebase Admin] ❌ CRITICAL ERROR: SDK initialization failed despite the secret being present. Error: ", 
        error.message
      );
    }
  }
} else {
  app = admin.apps[0]!;
  console.log('[Firebase Admin] SDK already initialized.');
}

// @ts-ignore - app might not be assigned if initialization fails, which is handled.
const adminDb = app ? admin.firestore() : undefined;
// @ts-ignore
const adminAuth = app ? admin.auth() : undefined;

export { adminDb, adminAuth };
