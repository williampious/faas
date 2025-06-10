
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
      setError("Firebase client configuration is missing. App features dependent on Firebase may not work as expected.");
      setIsLoading(false);
      return;
    }
    if (!auth || !db) {
      setError("Firebase auth or db service is not available. App features dependent on Firebase may not work as expected.");
      setIsLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsLoading(true);
        setError(null);
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data() as AgriFAASUserProfile;
            setUserProfile(profileData);
            setIsAdmin(profileData.role?.includes('Admin') || false);
          } else {
            setUserProfile(null);
            setIsAdmin(false);
            console.warn(`User profile not found in Firestore for UID: ${currentUser.uid}. This may occur if registration didn't complete, the profile was deleted, or if this is an old user account without a profile document.`);
            // setError("User profile not found. Some features may be limited. If this persists, please contact support.");
          }
          setIsLoading(false);
        }, (profileError) => {
          console.error("Error fetching user profile:", profileError);
          setError("Failed to fetch user profile. Some features might be unavailable.");
          setUserProfile(null);
          setIsAdmin(false);
          setIsLoading(false);
        });
        return () => unsubscribeProfile(); // Cleanup profile listener when auth state changes or component unmounts
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

    return () => unsubscribeAuth(); // Cleanup auth listener on component unmount
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
