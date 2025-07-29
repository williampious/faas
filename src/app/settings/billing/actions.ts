

'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import type { SubscriptionDetails, UserRole } from '@/types/user';
import { add, format } from 'date-fns';

type PlanId = 'starter' | 'grower' | 'business' | 'enterprise';
type BillingCycle = 'monthly' | 'annually';

export async function updateUserSubscription(userId: string, tenantId: string, planId: PlanId, billingCycle: BillingCycle): Promise<{success: boolean; message: string;}> {
    let adminDb;
    try {
        adminDb = getAdminDb();
    } catch (error: any) {
        console.error('[updateUserSubscription]', error.message);
        return { success: false, message: error.message };
    }
    
    if (!userId || !tenantId || !planId || !billingCycle) {
        const errorMessage = `Missing required data for subscription update.`;
        console.error('[updateUserSubscription]', errorMessage);
        return { success: false, message: errorMessage };
    }

    try {
        const tenantDocRef = adminDb.collection('tenants').doc(tenantId);

        const nextBillingDate = billingCycle === 'annually' 
          ? add(new Date(), { years: 1 })
          : add(new Date(), { months: 1 });

        const newSubscription: SubscriptionDetails = {
          planId,
          status: 'Active',
          billingCycle,
          nextBillingDate: format(nextBillingDate, 'yyyy-MM-dd'),
          trialEnds: null,
        };
        
        await tenantDocRef.update({
          subscription: newSubscription,
          updatedAt: adminDb.FieldValue.serverTimestamp(),
        });

        const successMessage = `Successfully updated subscription for tenant ${tenantId} to ${planId} (${billingCycle}).`;
        console.log('[updateUserSubscription]', successMessage);
        return { success: true, message: successMessage };

    } catch (error: any) {
        const errorMessage = `Failed to update subscription for tenant ${tenantId}. Error: ${error.message}`;
        console.error('[updateUserSubscription]', errorMessage, error);
        return { success: false, message: errorMessage };
    }
}
