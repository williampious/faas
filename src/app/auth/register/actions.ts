
'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import type { AgriFAASUserProfile, SubscriptionDetails } from '@/types/user';
import { add } from 'date-fns';
import type { User } from 'firebase/auth';

interface CreateProfileResult {
  success: boolean;
  message: string;
}

/**
 * Creates a Firestore profile document for a newly registered user.
 * This is now a self-contained server action to ensure it can be called reliably.
 * ALL new users get a 20-day trial of the Business plan.
 * @param user - The Firebase Auth User object.
 * @param fullName - The user's full name from the registration form.
 * @returns A result object indicating success or failure.
 */
export async function createProfileAfterRegistration(
  user: User, 
  fullName: string,
): Promise<CreateProfileResult> {
    let adminDb;
    try {
        adminDb = getAdminDb();
    } catch(error: any) {
        return { success: false, message: error.message };
    }
    
    const userDocRef = doc(adminDb, 'users', user.uid);
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

    const profileForFirestore: Omit<AgriFAASUserProfile, 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        firebaseUid: user.uid,
        fullName: fullName,
        emailAddress: user.email || '',
        role: [],
        accountStatus: 'Active',
        registrationDate: new Date().toISOString(),
        avatarUrl: `https://placehold.co/100x100.png?text=${fullName.charAt(0)}`,
        subscription: initialSubscription,
    };

    try {
        await setDoc(userDocRef, {
            ...profileForFirestore,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        console.log('User profile created in Firestore for user:', user.uid);
        return { success: true, message: "Profile created successfully." };
    } catch (error: any) {
        console.error("Error in createProfileAfterRegistration action:", error);
        return { success: false, message: `Failed to create profile in database: ${error.message}` };
    }
}
