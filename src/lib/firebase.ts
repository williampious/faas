
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

// This check is now exported to be used in other files.
export const isFirebaseClientConfigured = !Object.values(firebaseConfigValuesFromEnv).some(
  value => !value || typeof value !== 'string' || value.includes('YOUR_')
);

let appInstance: ReturnType<typeof initializeApp> | null = null;
let firestoreInstance: ReturnType<typeof getFirestore> | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;
let storageInstance: ReturnType<typeof getStorage> | null = null;

if (isFirebaseClientConfigured) {
  // Initialize Firebase App only if it hasn't been initialized yet.
  if (!getApps().length) {
    try {
      appInstance = initializeApp(firebaseConfigValuesFromEnv as FirebaseOptions);
      console.log("Firebase App Initialized Successfully.");
    } catch (e: any) {
      console.error("CRITICAL Firebase Error: Failed to initialize Firebase app.", e);
    }
  } else {
    appInstance = getApp();
  }

  // Get services from the initialized app instance.
  if (appInstance) {
    try {
      firestoreInstance = getFirestore(appInstance);
      authInstance = getAuth(appInstance);
      storageInstance = getStorage(appInstance);
    } catch (e: any) {
      console.error("CRITICAL Firebase Error: Failed to get Firestore/Auth/Storage instances.", e);
    }
  }
} else {
    const missingKeys = Object.entries(firebaseConfigValuesFromEnv)
      .filter(([, value]) => !value || typeof value !== 'string' || value.includes('YOUR_'))
      .map(([key]) => key);

    const errorMessage = "CRITICAL: Firebase client configuration is missing or incomplete. This app cannot connect to Firebase services.";
    const devMessage = 
        "👉 FOR LOCAL DEVELOPMENT: 👈\n" +
        "1. Ensure you have a `.env.local` file in the project root.\n" +
        "2. Make sure ALL `NEXT_PUBLIC_FIREBASE_...` variables are set with your actual Firebase project values.\n" +
        "3. Restart your Next.js development server.\n\n" +
        `Potentially missing or invalid keys: ${missingKeys.join(', ')}`;
    const prodMessage = 
        "👉 FOR DEPLOYED ENVIRONMENTS (e.g., Firebase App Hosting): 👈\n" +
        "1. Open the `.env` file in the project's ROOT directory.\n" +
        "2. Replace the placeholder values for `NEXT_PUBLIC_FIREBASE_...` with your actual keys.\n" +
        "3. Redeploy your application.\n\n" +
        `Potentially missing or invalid keys: ${missingKeys.join(', ')}`;

    console.error(errorMessage + "\n\n" + (process.env.NODE_ENV === 'development' ? devMessage : prodMessage));
}

// Export the potentially null instances. The context provider will check for their existence.
export const app = appInstance;
export const db = firestoreInstance;
export const auth = authInstance;
export const storage = storageInstance;
