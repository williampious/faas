
'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { SubscriptionDetails } from '@/types/user';

interface MigrationResult {
  success: boolean;
  message: string;
  processedCount?: number;
}

export async function migrateUsersToStarterPlan(): Promise<MigrationResult> {
  if (!adminDb) {
    return {
      success: false,
      message: 'Server configuration error. Admin database is not available.',
    };
  }

  try {
    const usersRef = adminDb.collection('users');
    // Find all users where the 'subscription' field does NOT exist.
    // Firestore doesn't have a "not exists" query, so we query for users
    // where the subscription plan is not one of the existing plans.
    // A better approach for larger datasets would be a Cloud Function, but this works for this context.
    // For this app, we will fetch all and filter in memory, which is acceptable for a few hundred users.
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      return { success: true, message: 'No users found to process.', processedCount: 0 };
    }

    const batch = adminDb.batch();
    let processedCount = 0;

    const starterSubscription: SubscriptionDetails = {
      planId: 'starter',
      status: 'Active',
      billingCycle: 'annually', // Default for free plan
      nextBillingDate: null,
    };

    snapshot.forEach(doc => {
      const user = doc.data();
      // Only update users who do not have the subscription field.
      if (!user.subscription) {
        batch.update(doc.ref, { 
          subscription: starterSubscription,
          updatedAt: new Date().toISOString() 
        });
        processedCount++;
      }
    });

    if (processedCount === 0) {
        return { success: true, message: 'All users already have a subscription plan. No migration needed.', processedCount: 0 };
    }

    await batch.commit();

    return {
      success: true,
      message: `Successfully migrated ${processedCount} users to the Starter plan.`,
      processedCount,
    };

  } catch (error: any) {
    console.error('Error during user migration:', error);
    return {
      success: false,
      message: `An error occurred: ${error.message}`,
    };
  }
}
