
'use client';

import type { AgriFAASUserProfile } from '@/types/user';
import { auth, db, isFirebaseClientConfigured } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface UserProfileContextType {
  user: User | null;
  userProfile: AgriFAASUserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AgriFAASUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseClientConfigured) {
      // This is the error if NEXT_PUBLIC_... vars are missing or placeholders
      setError("CRITICAL INIT PHASE 1: Firebase client environment variables (NEXT_PUBLIC_...) appear to be missing, incomplete, or use placeholder values. Please ensure these are correctly set in your hosting environment (e.g., Vercel, Cloud Run) and that the latest deployment includes these changes. App features dependent on Firebase will not work.");
      setIsLoading(false);
      return;
    }
    if (!auth || !db) {
      // This error occurs if Firebase init passed the env var check, but services are still null
      setError("CRITICAL INIT PHASE 2: Firebase services (Auth/DB) are not available even after environment variables seem correct. This could indicate a deeper issue with Firebase SDK initialization. Contact support if this persists after verifying environment variables.");
      setIsLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsLoading(true);
        // setError(null); // Clear error initially for a new auth state
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data() as AgriFAASUserProfile;
            setUserProfile(profileData);
            setIsAdmin(profileData.role?.includes('Admin') || false);
            setError(null); // Successfully fetched profile, clear any previous profile errors
          } else {
            setUserProfile(null);
            setIsAdmin(false);
            console.warn(`User profile not found in Firestore for UID: ${currentUser.uid}. This may occur if registration didn't complete, the profile was deleted, or if this is an old user account without a profile document.`);
            setError(`User profile document not found in Firestore for your account (UID: ${currentUser.uid}). Please complete registration or contact support if you believe this is an error.`);
          }
          setIsLoading(false);
        }, (firestoreError: any) => { // Catching Firestore errors for onSnapshot
          console.error("Error fetching user profile from Firestore:", firestoreError);
          if (firestoreError.code === 'permission-denied') {
            setError("Permission denied: Could not fetch your user profile from Firestore. This is likely due to Firestore security rules. Please ensure rules allow authenticated users to read their own profile in the 'users' collection.");
          } else {
            setError(`Failed to fetch user profile due to a database error (code: ${firestoreError.code || 'unknown'}). Some features might be unavailable. Please try again or contact support.`);
          }
          setUserProfile(null);
          setIsAdmin(false);
          setIsLoading(false);
        });
        return () => unsubscribeProfile(); 
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setIsLoading(false);
        setError(null); // No user, so no profile error
      }
    }, (authError) => {
        console.error("Auth state change error:", authError);
        setError("Authentication error. Please try refreshing the page.");
        setIsLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <UserProfileContext.Provider value={{ user, userProfile, isLoading, isAdmin, error }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
