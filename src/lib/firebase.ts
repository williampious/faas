// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfigValuesFromEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// More robust check for valid configuration values
const missingOrPlaceholderKeys = Object.entries(firebaseConfigValuesFromEnv)
  .filter(([key, value]) => {
    const commonPlaceholders = ["YOUR_API_KEY", "YOUR_PROJECT_ID", "YOUR_AUTH_DOMAIN", "YOUR_APP_ID", "YOUR_STORAGE_BUCKET", "YOUR_MESSAGING_SENDER_ID"];
    return !value ||
           typeof value !== 'string' ||
           value.trim() === '' ||
           commonPlaceholders.some(placeholder => value.includes(placeholder));
  })
  .map(([key]) => key);

export const isFirebaseClientConfigured = missingOrPlaceholderKeys.length === 0;

let appInstance: ReturnType<typeof initializeApp> | null = null;
let firestoreInstance: ReturnType<typeof getFirestore> | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;
let storageInstance: ReturnType<typeof getStorage> | null = null;

if (!isFirebaseClientConfigured) {
  const errorMessage = "CRITICAL: Firebase client configuration is missing or incomplete. This app cannot connect to Firebase services."
  // Differentiate error message for developers vs production.
  if (process.env.NODE_ENV === 'development') {
      console.error(
        errorMessage + "\n\n" +
        "👉 FOR LOCAL DEVELOPMENT: 👈\n" +
        "1. Ensure you have a `.env.local` file in the project root.\n" +
        "2. Make sure ALL `NEXT_PUBLIC_FIREBASE_...` variables in that file are set with actual values from your Firebase project.\n" +
        "3. Restart your Next.js development server after making changes.\n\n" +
        "Potentially missing or invalid keys: " + (missingOrPlaceholderKeys.join(', ') || 'N/A')
      );
  } else {
      console.error(
        errorMessage + "\n\n" +
        "👉 FOR DEPLOYED ENVIRONMENTS (Firebase App Hosting):\n" +
        "1. Open the `.env` file in the project's ROOT directory.\n" +
        "2. Replace the placeholder values for `NEXT_PUBLIC_FIREBASE_...` with your actual keys from the Firebase console.\n" +
        "3. Redeploy your application. These values are safely baked into your client-side code during the build process.\n\n" +
        "Potentially missing or invalid keys: " + (missingOrPlaceholderKeys.join(', ') || 'N/A')
      );
  }
} else {
  if (!getApps().length) {
    try {
      appInstance = initializeApp(firebaseConfigValuesFromEnv as FirebaseOptions);
    } catch (e: any) {
      console.error("CRITICAL Firebase Error: Failed to initialize Firebase app (client-side). Check configuration values.", e);
    }
  } else {
    appInstance = getApp();
  }

  if (appInstance) {
    try {
      firestoreInstance = getFirestore(appInstance);
      authInstance = getAuth(appInstance);
      storageInstance = getStorage(appInstance);
    } catch (e: any) {
        console.error("CRITICAL Firebase Error: Failed to get Firestore/Auth/Storage instances.", e);
    }
  }
}

export const app = appInstance;
export const db = firestoreInstance;
export const auth = authInstance;
export const storage = storageInstance;
