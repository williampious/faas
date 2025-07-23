
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// This file is a standard server-side module. It should NOT have 'use server'.
// It initializes the Firebase Admin SDK once and exports the services for use
// in other server-side logic, such as Server Actions.

let app: admin.App | undefined;

const checkEnvVars = () => {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  console.log('[Firebase Admin] Checking for server-side environment variable: FIREBASE_SERVICE_ACCOUNT_JSON...');

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
    return false;
  }
  
  try {
    const parsed = JSON.parse(serviceAccountJson);
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
        console.error('[Firebase Admin] ❌ INVALID: The FIREBASE_SERVICE_ACCOUNT_JSON value is not a valid service account JSON.');
        return false;
    }
  } catch(e) {
      console.error('[Firebase Admin] ❌ INVALID: Could not parse the FIREBASE_SERVICE_ACCOUNT_JSON value. Ensure it is a valid JSON string.');
      return false;
  }

  console.log(`[Firebase Admin] ✅ FOUND: The 'FIREBASE_SERVICE_ACCOUNT_JSON' secret is present and appears valid.`);
  return true;
};

const hasValidEnv = checkEnvVars();

if (!admin.apps.length) {
  if (hasValidEnv) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!);
      
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
  } else {
    console.error("[Firebase Admin] ❌ SKIPPING INITIALIZATION due to missing or invalid secrets.");
  }
} else {
  app = admin.apps[0];
  if(app) {
    console.log('[Firebase Admin] SDK already initialized.');
  } else {
    console.error('[Firebase Admin] admin.apps has entries but the first one is not a valid App object.');
  }
}

// Export the initialized services. They will be undefined if initialization failed.
const adminDb = app ? admin.firestore() : undefined;
const adminAuth = app ? admin.auth() : undefined;

export { adminDb, adminAuth };
