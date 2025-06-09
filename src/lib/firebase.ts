// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const allConfigPresent = Object.values(firebaseConfigValues).every(value => !!value && value !== "YOUR_API_KEY" && value !== "YOUR_PROJECT_ID"); // Basic check

let appInstance: ReturnType<typeof initializeApp> | null = null;
let firestoreInstance: ReturnType<typeof getFirestore> | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;

if (!allConfigPresent) {
  console.warn(
    "Warning: Firebase client configuration is missing, incomplete, or uses placeholder values. " +
    "Please ensure all NEXT_PUBLIC_FIREBASE_... variables are correctly set in your .env file. " +
    "Firebase client features may not be initialized or work correctly."
  );
} else {
  if (!getApps().length) {
    try {
      appInstance = initializeApp(firebaseConfigValues as FirebaseOptions);
    } catch (e) {
      console.error("Error initializing Firebase app (client-side):", e);
    }
  } else {
    appInstance = getApp();
  }

  if (appInstance) {
    try {
      firestoreInstance = getFirestore(appInstance);
      authInstance = getAuth(appInstance);
    } catch (e) {
        console.error("Error getting Firestore/Auth instances (client-side):", e);
    }
  }
}

export const app = appInstance;
export const db = firestoreInstance; // This will be your client-side Firestore instance
export const auth = authInstance;
