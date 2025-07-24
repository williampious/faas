
'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import type { AgriFAASUserProfile, SubscriptionDetails } from '@/types/user';
import { add } from 'date-fns';
import type { User } from 'firebase/auth';

interface RegistrationData {
  fullName: string;
  email: string;
}

interface CreateProfileResult {
  success: boolean;
  message: string;
}

const usersCollectionName = 'users';

/**
 * Creates a Firestore profile document for a newly registered user.
 * This is now a self-contained server action to ensure it can be called reliably.
 * ALL new users get a 20-day trial of the Business plan.
 * @param user - The Firebase Auth User object.
 * @param data - The user's registration data (fullName, email).
 * @returns A result object indicating success or failure.
 */
export async function createProfileDocument(
  user: User, 
  data: RegistrationData,
): Promise<CreateProfileResult> {
    if (!db) {
        return { success: false, message: "Database service is not available." };
    }
    
    const userDocRef = doc(db, usersCollectionName, user.uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        console.log(`Profile for user ${user.uid} already exists. Skipping creation.`);
        return { success: true, message: "Profile already exists." };
    }

    const trialEndDate = add(new Date(), { days: 20 });

    const initialSubscription: SubscriptionDetails = {
        planId: 'business', // Universal Business plan trial
        status: 'Trialing',
        billingCycle: 'annually', // Default to annual
        nextBillingDate: null,
        trialEnds: trialEndDate.toISOString(),
    };

    const profileForFirestore: Omit<AgriFAASUserProfile, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        userId: user.uid,
        firebaseUid: user.uid,
        fullName: data.fullName,
        emailAddress: user.email || data.email,
        role: [],
        accountStatus: 'Active',
        registrationDate: new Date().toISOString(),
        phoneNumber: '',
        avatarUrl: `https://placehold.co/100x100.png?text=${data.fullName.charAt(0)}`,
        subscription: initialSubscription,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    try {
        await setDoc(userDocRef, profileForFirestore);
        console.log('User profile created in Firestore for user:', user.uid);
        return { success: true, message: "Profile created successfully." };
    } catch (error: any) {
        console.error("Error in createProfileDocument action:", error);
        return { success: false, message: `Failed to create profile in database: ${error.message}` };
    }
}
