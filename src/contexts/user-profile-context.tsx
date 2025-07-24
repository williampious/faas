
'use client';

import type { AgriFAASUserProfile, SubscriptionDetails } from '@/types/user';
import { auth, db, isFirebaseClientConfigured } from '@/lib/firebase';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { add, isAfter } from 'date-fns';

interface UserAccess {
  canAccessFarmOps: boolean;
  canAccessAnimalOps: boolean;
  canAccessOfficeOps: boolean;
  canAccessHrOps: boolean;
  canAccessAeoTools: boolean;
}

interface UserProfileContextType {
  user: User | null;
  userProfile: AgriFAASUserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
  access: UserAccess;
}

const defaultAccess: UserAccess = {
    canAccessFarmOps: false,
    canAccessAnimalOps: false,
    canAccessOfficeOps: false,
    canAccessHrOps: false,
    canAccessAeoTools: false,
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

// This is the self-healing function to create a profile if one is missing for an authenticated user.
async function createMissingProfile(user: User): Promise<AgriFAASUserProfile | null> {
    if (!db) return null;
    const userDocRef = doc(db, 'users', user.uid);
    
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        return docSnap.data() as AgriFAASUserProfile;
    }
    
    console.warn(`Attempting to self-heal profile for user: ${user.uid}`);

    const trialEndDate = add(new Date(), { days: 20 });
    const initialSubscription: SubscriptionDetails = {
        planId: 'business',
        status: 'Trialing',
        billingCycle: 'annually',
        nextBillingDate: null,
        trialEnds: trialEndDate.toISOString(),
    };

    const newProfile: Omit<AgriFAASUserProfile, 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        firebaseUid: user.uid,
        fullName: user.displayName || "New User",
        emailAddress: user.email || '',
        role: [],
        accountStatus: 'Active',
        registrationDate: new Date().toISOString(),
        avatarUrl: user.photoURL || `https://placehold.co/100x100.png?text=${(user.displayName || "U").charAt(0)}`,
        subscription: initialSubscription,
    };

    try {
        await setDoc(userDocRef, {
            ...newProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        const createdDocSnap = await getDoc(userDocRef);
        return createdDocSnap.data() as AgriFAASUserProfile;
    } catch (error) {
        console.error("Self-healing profile creation failed:", error);
        return null;
    }
}


export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AgriFAASUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<UserAccess>(defaultAccess);

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

    let unsubscribeProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeProfile();

      setUser(currentUser);
      if (currentUser) {
        setIsLoading(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data() as AgriFAASUserProfile;
            setUserProfile(profileData);
            
            const userIsAdmin = profileData.role?.includes('Admin') || false;
            setIsAdmin(userIsAdmin);

            const plan = profileData.subscription?.planId || 'starter';
            const status = profileData.subscription?.status;
            const trialEnds = profileData.subscription?.trialEnds;
            
            const isTrialActive = status === 'Trialing' && trialEnds && isAfter(new Date(trialEnds), new Date());
            
            const hasPaidAccess = status === 'Active' || isTrialActive;

            const canAccessGrowerFeatures = (plan === 'grower' || plan === 'business' || plan === 'enterprise') && hasPaidAccess;
            const canAccessBusinessFeatures = (plan === 'business' || plan === 'enterprise') && hasPaidAccess;

            setAccess({
                canAccessFarmOps: canAccessGrowerFeatures,
                canAccessAnimalOps: canAccessGrowerFeatures,
                canAccessOfficeOps: canAccessBusinessFeatures,
                canAccessHrOps: canAccessBusinessFeatures,
                canAccessAeoTools: canAccessBusinessFeatures,
            });
            setError(null);
            setIsLoading(false);
          } else {
            const healedProfile = await createMissingProfile(currentUser);
            if(healedProfile) {
                setUserProfile(healedProfile);
                 // No need to set anything else, the onSnapshot will re-trigger with the new data
            } else {
                setUserProfile(null);
                setIsAdmin(false);
                setAccess(defaultAccess);
                setError(`Your account exists, but we couldn't find or create your user profile. This could be a permission issue with your database rules. Please contact support.`);
                setIsLoading(false);
            }
          }
        }, (firestoreError: any) => { 
          console.error("Error fetching user profile from Firestore:", firestoreError);
          if (firestoreError.code === 'permission-denied' || firestoreError.message.toLowerCase().includes('permission denied')) {
            setError(`CRITICAL PERMISSION ERROR: Firestore denied access to your profile at 'users/${currentUser.uid}'. YOUR FIRESTORE SECURITY RULES ARE BLOCKING THIS. You MUST update your Firestore Rules in the Firebase Console. A common rule needed is: 'match /users/{userId} { allow read, write: if request.auth.uid == userId; }'. Please review Firebase documentation on Security Rules and apply the necessary permissions for user profile access.`);
          } else {
            setError(`Failed to fetch user profile due to a database error (code: ${firestoreError.code || 'unknown'}). Some features might be unavailable. Please try again or contact support.`);
          }
          setUserProfile(null);
          setIsAdmin(false);
          setAccess(defaultAccess);
          setIsLoading(false);
        });
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setAccess(defaultAccess);
        setIsLoading(false);
        setError(null); 
      }
    }, (authError) => {
        console.error("Auth state change error:", authError);
        setError("Authentication error. Please try refreshing the page.");
        setIsLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  return (
    <UserProfileContext.Provider value={{ user, userProfile, isLoading, isAdmin, error, access }}>
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
