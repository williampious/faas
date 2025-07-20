
'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { SubscriptionDetails } from '@/types/user';
import { add, format } from 'date-fns';


/**
 * Updates a user's subscription details in Firestore. This is the single source of truth for subscription changes.
 * @param userId - The ID of the user to update.
 * @param planId - The new plan ID.
 * @param billingCycle - The new billing cycle.
 * @returns A promise that resolves when the update is complete.
 */
export async function updateUserSubscription(userId: string, planId: 'starter' | 'grower' | 'business' | 'enterprise', billingCycle: 'monthly' | 'annually'): Promise<{success: boolean; message: string;}> {
    if (!adminDb) {
        const errorMessage = "Firebase Admin SDK is not initialized. This is a server-configuration issue. Please check your environment variables (FIREBASE_PRIVATE_KEY, etc.) as described in the README.md file.";
        console.error('[updateUserSubscription]', errorMessage);
        return { success: false, message: errorMessage };
    }
    
    if (!userId || !planId || !billingCycle) {
        const errorMessage = `Missing required data for subscription update: userId=${userId}, planId=${planId}, billingCycle=${billingCycle}`;
        console.error('[updateUserSubscription]', errorMessage);
        return { success: false, message: errorMessage };
    }

    try {
        const userDocRef = adminDb.collection('users').doc(userId);

        const nextBillingDate = billingCycle === 'annually' 
          ? add(new Date(), { years: 1 })
          : add(new Date(), { months: 1 });

        const newSubscription: SubscriptionDetails = {
          planId,
          status: 'Active',
          billingCycle: billingCycle,
          nextBillingDate: format(nextBillingDate, 'yyyy-MM-dd'),
          trialEnds: null, // Clear trial period on successful payment
        };

        await userDocRef.update({
          subscription: newSubscription,
          updatedAt: new Date().toISOString(),
        });

        const successMessage = `Successfully updated subscription for user ${userId} to ${planId} (${billingCycle}).`;
        console.log('[updateUserSubscription]', successMessage);
        return { success: true, message: successMessage };

    } catch (error: any) {
        const errorMessage = `Failed to update subscription for user ${userId}. Error: ${error.message}`;
        console.error('[updateUserSubscription]', errorMessage, error);
        return { success: false, message: errorMessage };
    }
}
