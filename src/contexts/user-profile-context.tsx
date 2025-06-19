
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
      setError("CRITICAL INIT PHASE 1: Firebase client environment variables (NEXT_PUBLIC_...) appear to be missing, incomplete, or use placeholder values. Please ensure these are correctly set in your hosting environment (e.g., Vercel, Cloud Run) and that the latest deployment includes these changes. App features dependent on Firebase will not work.");
      setIsLoading(false);
      return;
    }
    if (!auth || !db) {
      setError("CRITICAL INIT PHASE 2: Firebase services (Auth/DB) are not available even after environment variables seem correct. This could indicate a deeper issue with Firebase SDK initialization. Contact support if this persists after verifying environment variables.");
      setIsLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsLoading(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data() as AgriFAASUserProfile;
            setUserProfile(profileData);
            setIsAdmin(profileData.role?.includes('Admin') || false);
            setError(null); 
          } else {
            setUserProfile(null);
            setIsAdmin(false);
            console.warn(`User profile not found in Firestore for UID: ${currentUser.uid}. This may occur if registration didn't complete, the profile was deleted, or if this is an old user account without a profile document.`);
            setError(`User profile document not found in Firestore for your account (UID: ${currentUser.uid}). Please complete registration or contact support if you believe this is an error.`);
          }
          setIsLoading(false);
        }, (firestoreError: any) => { 
          console.error("Error fetching user profile from Firestore:", firestoreError);
          if (firestoreError.code === 'permission-denied') {
            setError(`Firestore Permission Denied: Could not read your user profile (path: users/${currentUser.uid}). Please check your Firebase Firestore security rules. Ensure that an authenticated user has permission to read their own document in the 'users' collection (e.g., 'allow read: if request.auth.uid == userId;').`);
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
        setError(null); 
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
