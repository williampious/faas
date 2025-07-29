
// src/app/api/webhooks/paystack/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import type { SubscriptionDetails } from '@/types/user';
import { add, format } from 'date-fns';

async function updateUserSubscription(tenantId: string, planId: any, billingCycle: any): Promise<{success: boolean; message: string;}> {
    let adminDb;
    try {
        adminDb = getAdminDb();
    } catch (error: any) {
        return { success: false, message: error.message };
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

        return { success: true, message: "Subscription updated successfully." };
    } catch (error: any) {
        return { success: false, message: `Failed to update subscription: ${error.message}` };
    }
}

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("Paystack webhook error: PAYSTACK_SECRET_KEY is not set.");
    return NextResponse.json({ status: 'error', message: 'Server configuration error.' }, { status: 500 });
  }

  const body = await req.text();
  const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');
  const signature = req.headers.get('x-paystack-signature');

  if (hash !== signature) {
    console.warn("Paystack webhook error: Invalid signature.");
    return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === 'charge.success') {
    const { metadata, reference } = event.data;
    const { tenant_id, plan_id, billing_cycle, promo_code } = metadata;

    if (!tenant_id || !plan_id || !billing_cycle) {
        console.error(`Webhook error: Missing metadata from Paystack for reference ${reference}.`);
        return NextResponse.json({ status: 'error', message: 'Incomplete metadata.' }, { status: 400 });
    }
    
    console.log(`Processing successful payment for tenant ${tenant_id}, plan ${plan_id}.`);

    try {
      const adminDb = getAdminDb();
      
      await adminDb.runTransaction(async (transaction) => {
        const tenantRef = adminDb.collection('tenants').doc(tenant_id);
        const tenantDoc = await transaction.get(tenantRef);

        if (!tenantDoc.exists) {
            console.error(`Webhook error: Tenant document for tenant_id ${tenant_id} not found.`);
            return;
        }

        const nextBillingDate = billingCycle === 'annually' 
            ? add(new Date(), { years: 1 })
            : add(new Date(), { months: 1 });

        const newSubscription: SubscriptionDetails = {
            planId: plan_id,
            status: 'Active',
            billingCycle: billing_cycle,
            nextBillingDate: format(nextBillingDate, 'yyyy-MM-dd'),
            trialEnds: null,
        };

        transaction.update(tenantRef, {
            subscription: newSubscription,
            updatedAt: adminDb.FieldValue.serverTimestamp(),
        });

        if (promo_code) {
          const promoQuery = adminDb.collection('promotionalCodes').where('code', '==', promo_code.toUpperCase()).limit(1);
          const promoSnapshot = await promoQuery.get(); 

          if (!promoSnapshot.empty) {
            const promoDocRef = promoSnapshot.docs[0].ref;
            const usageRecordRef = promoDocRef.collection('recordedUsages').doc(reference);
            const usageRecordSnap = await transaction.get(usageRecordRef);

            if (!usageRecordSnap.exists) {
              const currentUses = promoSnapshot.docs[0].data()?.timesUsed || 0;
              transaction.update(promoDocRef, { timesUsed: currentUses + 1 });
              transaction.set(usageRecordRef, {
                timestamp: adminDb.FieldValue.serverTimestamp(),
                paymentReference: reference,
                tenantId: tenant_id,
              });
            }
          }
        }
      });
      
      console.log(`Successfully processed webhook for reference ${reference}.`);
      return NextResponse.json({ status: 'success' }, { status: 200 });

    } catch (error: any) {
      console.error(`CRITICAL: Error processing webhook transaction for reference ${reference}:`, error);
      return NextResponse.json({ status: 'error', message: 'Internal server error processing webhook.' }, { status: 500 });
    }
  }

  return NextResponse.json({ status: 'success', message: 'Webhook received.' }, { status: 200 });
}
