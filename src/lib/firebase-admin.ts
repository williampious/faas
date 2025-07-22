// src/lib/firebase-admin.ts
'use server';

import * as admin from 'firebase-admin';

// This file is marked with 'use server', so it will only ever run on the server.
// This is the single, definitive initialization of the Firebase Admin SDK.

let app: admin.App | undefined;

// A function to check if the required environment variables are present and look valid.
const checkEnvVars = () => {
  const requiredVars = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  };

  console.log('[Firebase Admin] Checking for server-side environment variables...');

  let allVarsPresent = true;
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      console.error(`[Firebase Admin] ❌ MISSING: The '${key}' environment variable is not set.`);
      allVarsPresent = false;
    } else {
      console.log(`[Firebase Admin] ✅ FOUND: The '${key}' environment variable is present.`);
    }
  }

  if (requiredVars.FIREBASE_PRIVATE_KEY && !requiredVars.FIREBASE_PRIVATE_KEY.startsWith('-----BEGIN PRIVATE KEY-----')) {
    console.error(
      "[Firebase Admin] ❌ INVALID: The 'FIREBASE_PRIVATE_KEY' environment variable appears to be invalid. It should start with '-----BEGIN PRIVATE KEY-----'. Please ensure the entire key, including the header and footer lines, is copied correctly."
    );
    return false;
  }
  
  if (!allVarsPresent) {
      console.error("[Firebase Admin] CRITICAL ERROR: One or more required server-side environment variables are missing. The Admin SDK will not be initialized. Please check your hosting provider's secret management settings. You may need to redeploy your application after setting these secrets.");
      return false;
  }

  return true;
};

const hasValidEnv = checkEnvVars();

if (!admin.apps.length) {
  if (hasValidEnv) {
    try {
      // For App Hosting, these are injected from Secret Manager.
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('[Firebase Admin] ✅ SDK initialized successfully.');
    } catch (error: any) {
      console.error(
        "[Firebase Admin] ❌ CRITICAL ERROR: SDK initialization failed despite environment variables being present. Error: ", 
        error.message,
        "This usually happens if the environment variables contain typos or are not properly formatted."
      );
    }
  } else {
    console.error(`
      ===============================================================
      [Firebase Admin] ❌ SKIPPING INITIALIZATION
      REASON: Due to missing or invalid server-side environment variables.
      
      ACTION REQUIRED:
      1. Ensure 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', and 'FIREBASE_PRIVATE_KEY' are set in your hosting environment's secret manager.
      2. IMPORTANT: After setting the secrets, you MUST redeploy your application for the changes to take effect.
      3. Refer to the README.md file for detailed, step-by-step instructions.
      ===============================================================
    `);
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
const isFirebaseAdminConfigured = !!app;

export { adminDb, adminAuth, isFirebaseAdminConfigured };
