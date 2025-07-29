
'use client';

import type { AgriFAASUserProfile, Farm } from '@/types';
import { auth, db } from '@/lib/firebase';
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
  farmProfile: Farm | null;
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

async function createMissingProfile(user: User): Promise<void> {
    if (!db) {
        console.error("Self-healing failed: Firestore service is not available.");
        return;
    }
    const userDocRef = doc(db, 'users', user.uid);
    
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        console.log(`Profile for user ${user.uid} already exists. Skipping creation.`);
        return;
    }
    
    console.warn(`Attempting to self-heal profile for user: ${user.uid}`);

    const newProfile: Omit<AgriFAASUserProfile, 'createdAt' | 'updatedAt' | 'subscription'> = {
        userId: user.uid,
        firebaseUid: user.uid,
        fullName: user.displayName || "New User",
        emailAddress: user.email || '',
        role: [],
        accountStatus: 'Active',
        registrationDate: new Date().toISOString(),
        avatarUrl: user.photoURL || `https://placehold.co/100x100.png?text=${(user.displayName || "U").charAt(0)}`,
    };

    try {
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
  const [farmProfile, setFarmProfile] = useState<Farm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<UserAccess>(defaultAccess);

  useEffect(() => {
    if (!auth || !db) {
      setError("CRITICAL: Firebase services (Auth/DB) are not available. Check environment variables.");
      setIsLoading(false);
      return;
    }

    let unsubscribeUser = () => {};
    let unsubscribeFarm = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeUser();
      unsubscribeFarm();

      setUser(currentUser);
      if (currentUser) {
        setIsLoading(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        unsubscribeUser = onSnapshot(userDocRef, async (userDoc) => {
          if (userDoc.exists()) {
            const profileData = { ...userDoc.data(), userId: userDoc.id } as AgriFAASUserProfile;
            setUserProfile(profileData);
            
            const isSuperAdmin = profileData.role?.includes('Super Admin') || false;
            setIsAdmin(profileData.role?.includes('Admin') || isSuperAdmin);

            // Now listen to the farm/tenant document if tenantId exists
            if (profileData.tenantId) {
              const farmDocRef = doc(db, 'tenants', profileData.tenantId);
              unsubscribeFarm = onSnapshot(farmDocRef, (farmDoc) => {
                if(farmDoc.exists()){
                  const farmData = farmDoc.data() as Farm;
                  setFarmProfile(farmData);
                  const plan = farmData.subscription?.planId || 'starter';
                  const status = farmData.subscription?.status;
                  const trialEnds = farmData.subscription?.trialEnds;
              
                  const isTrialActive = status === 'Trialing' && trialEnds && isAfter(new Date(trialEnds), new Date());
                  const hasPaidAccess = status === 'Active' || isTrialActive;

                  const canAccessGrowerFeatures = (plan === 'grower' || plan === 'business' || plan === 'enterprise') && hasPaidAccess;
                  const canAccessBusinessFeatures = (plan === 'business' || plan === 'enterprise') && hasPaidAccess;

                  setAccess({
                      canAccessFarmOps: canAccessGrowerFeatures,
                      canAccessAnimalOps: canAccessGrowerFeatures,
                      canAccessOfficeOps: canAccessBusinessFeatures,
                      canAccessHrOps: canAccessBusinessFeatures,
                      canAccessAeoTools: canAccessBusinessFeatures && profileData.role.includes('Agric Extension Officer'),
                  });
                } else {
                  setFarmProfile(null);
                  setAccess(defaultAccess);
                }
                setIsLoading(false);
              }, (farmError) => {
                 console.error("Error fetching farm profile:", farmError);
                 setError("Could not load farm-specific data.");
                 setIsLoading(false);
              });
            } else { // User exists but has no tenantId (e.g., AEO during setup)
              setFarmProfile(null);
              // AEO access is determined by role, not plan, if they are not part of a tenant.
              const isAeoWithoutTenant = profileData.role?.includes('Agric Extension Officer');
              setAccess({
                ...defaultAccess,
                canAccessAeoTools: isAeoWithoutTenant,
              });
              setIsLoading(false);
            }
            
            setError(null);
          } else {
            // This case handles a logged-in user who for some reason does not have a firestore doc.
            // This can happen if registration is interrupted.
            console.warn(`No Firestore profile found for authenticated user ${currentUser.uid}. Attempting to self-heal.`);
            await createMissingProfile(currentUser);
            // The onSnapshot listener will be triggered again once the profile is created.
            setIsLoading(false); 
          }
        }, (firestoreError) => {
          console.error("Error fetching user profile from Firestore:", firestoreError);
          setError(`Failed to fetch user profile: ${firestoreError.message}`);
          setUserProfile(null);
          setIsAdmin(false);
          setAccess(defaultAccess);
          setIsLoading(false);
        });
      } else { // No current user
        setUserProfile(null);
        setFarmProfile(null);
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
      unsubscribeUser();
      unsubscribeFarm();
    };
  }, []);

  return (
    <UserProfileContext.Provider value={{ user, userProfile, farmProfile, isLoading, isAdmin, error, access }}>
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
