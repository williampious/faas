
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
async function createMissingProfile(user: User): Promise<void> {
    if (!db) {
        console.error("Self-healing failed: Firestore service is not available.");
        return;
    }
    const userDocRef = doc(db, 'users', user.uid);
    
    // Check one last time before writing to prevent race conditions.
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        console.log(`Profile for user ${user.uid} already exists. Skipping creation.`);
        return;
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
        // Set the document. The onSnapshot listener will then pick up this new document
        // and update the application state, making this function's return value unnecessary.
        await setDoc(userDocRef, {
            ...newProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Self-healing profile creation failed:", error);
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
    // The detailed check is now inside firebase.ts. We just check for service availability here.
    if (!auth || !db) {
      setError("CRITICAL: Firebase services (Auth/DB) are not available. This is often due to missing or incorrect environment variables. Check the browser console for detailed setup instructions.");
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

            const isSuperAdmin = profileData.role?.includes('Super Admin') || false;

            if (isSuperAdmin) {
              // Super Admin gets full access, regardless of subscription.
              setAccess({
                canAccessFarmOps: true,
                canAccessAnimalOps: true,
                canAccessOfficeOps: true,
                canAccessHrOps: true,
                canAccessAeoTools: true,
              });
            } else {
              // Standard permission logic for all other users.
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
            }
            setError(null);
            setIsLoading(false);
          } else {
            // Attempt to create the profile. The onSnapshot listener will then
            // fire again with the new data, triggering the logic above.
            await createMissingProfile(currentUser);
            // No need to set state here, the listener will handle it.
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
