
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
           commonPlaceholders.some(placeholder => value.includes(placeholder)) ||
           (key === 'projectId' && value.includes("demo-")); // Firebase demo projects often have "demo-"
  })
  .map(([key]) => key);

export const isFirebaseClientConfigured = missingOrPlaceholderKeys.length === 0;

let appInstance: ReturnType<typeof initializeApp> | null = null;
let firestoreInstance: ReturnType<typeof getFirestore> | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;

if (!isFirebaseClientConfigured) {
  console.warn(
    "🛑 Firebase Client Initialization Error: Your Firebase client-side configuration appears to be missing, incomplete, or uses placeholder values. " +
    "Firebase client features (like Authentication and Firestore) will NOT be initialized. \n\n" +
    "👉 PLEASE CHECK THE FOLLOWING: 👈\n" +
    "1. For local development: Your `.env.local` file (in the project root) has ALL `NEXT_PUBLIC_FIREBASE_...` variables correctly set with actual values from your Firebase project's web app settings (NOT placeholders), AND you have RESTARTED your Next.js development server after changes.\n" +
    "2. For deployed environments (like Vercel, Cloud Run, etc.): Ensure ALL `NEXT_PUBLIC_FIREBASE_...` variables are correctly set in your hosting platform's environment variable settings.\n\n" +
    "Potentially problematic configuration keys based on our checks: " + (missingOrPlaceholderKeys.join(', ') || 'None (check for empty strings, typos, or other placeholder patterns).') + "\n\n" +
    "🔍 Values currently being read by the application for Firebase config keys (VERIFY THESE AGAINST YOUR FIREBASE CONSOLE OR HOSTING PLATFORM SETTINGS): \n" + JSON.stringify(firebaseConfigValuesFromEnv, null, 2)
  );
} else {
  if (!getApps().length) {
    try {
      console.log("Attempting to initialize Firebase app with config:", firebaseConfigValuesFromEnv);
      appInstance = initializeApp(firebaseConfigValuesFromEnv as FirebaseOptions);
      console.log("Firebase app initialized successfully (client-side).");
    } catch (e: any) {
      console.error(
        "CRITICAL Firebase Error: Failed to initialize Firebase app (client-side). " +
        "This is very likely due to invalid or incomplete Firebase configuration values. " +
        "Ensure all NEXT_PUBLIC_FIREBASE_... variables in .env.local (for local dev) or your hosting environment (for deployment) are correct and the server/service was restarted/redeployed after changes.",
        "Error Details:", e.message,
        "Stack:", e.stack,
        "Configuration used (verify these values):", firebaseConfigValuesFromEnv
      );
    }
  } else {
    appInstance = getApp();
    console.log("Firebase app already initialized, getting existing instance (client-side).");
  }

  if (appInstance) {
    try {
      firestoreInstance = getFirestore(appInstance);
      authInstance = getAuth(appInstance);
      console.log("Firestore and Auth instances obtained (client-side).");
    } catch (e: any) {
        console.error(
            "CRITICAL Firebase Error: Failed to get Firestore/Auth instances from the initialized app (client-side).",
            "Error Details:", e.message,
            "Stack:", e.stack
        );
    }
  } else if (isFirebaseClientConfigured) {
     // This case means isFirebaseClientConfigured was true, but appInstance is still null.
     // This implies initializeApp likely failed and the error was caught above.
     console.error(
        "CRITICAL Firebase Error: appInstance is null after attempting initialization (client-side), " +
        "even though configuration seemed to pass initial checks. " +
        "This strongly indicates that initializeApp failed. Please review previous console errors for details from the 'catch' block."
     );
  }
}

export const app = appInstance;
export const db = firestoreInstance;
export const auth = authInstance;
