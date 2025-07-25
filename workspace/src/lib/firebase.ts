
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// A simple check to see if the environment variables have been populated.
// This is the most common source of error.
export const isFirebaseClientConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let appInstance: ReturnType<typeof initializeApp> | null = null;
let firestoreInstance: ReturnType<typeof getFirestore> | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;
let storageInstance: ReturnType<typeof getStorage> | null = null;

if (isFirebaseClientConfigured) {
  if (!getApps().length) {
    try {
      appInstance = initializeApp(firebaseConfig);
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
} else {
  // This message will appear in the browser console if the app is deployed without the necessary secrets.
  console.error(
    "CRITICAL: Firebase client configuration is missing or incomplete. " +
    "This app cannot connect to Firebase services. Ensure all `NEXT_PUBLIC_FIREBASE_...` " +
    "secrets are set in your hosting environment (e.g., Google Cloud Secret Manager) " +
    "and the app has been redeployed. Refer to the README.md for the full list of required secrets."
  );
}

export const app = appInstance;
export const db = firestoreInstance;
export const auth = authInstance;
export const storage = storageInstance;
