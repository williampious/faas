
// src/app/api/webhooks/paystack/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { updateUserSubscription } from '@/app/settings/billing/actions';
import { getAdminDb } from '@/lib/firebase-admin';
import type { FieldValue } from 'firebase-admin/firestore';

/**
 * Handles Paystack webhook events.
 * This is the definitive source of truth for successful payments.
 * It is designed to be idempotent to handle webhook retries gracefully.
 */
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

  // --- Handle Successful Charge ---
  if (event.event === 'charge.success') {
    const { metadata, reference, amount } = event.data;
    const { user_id, plan_id, billing_cycle, promo_code } = metadata;

    console.log(`Processing successful payment webhook for user ${user_id}, plan ${plan_id}, reference ${reference}`);

    try {
      const adminDb = getAdminDb(); // Ensure DB is initialized
      
      // 1. Update user subscription and promo code usage in a transaction
      // to ensure atomicity and idempotency.
      await adminDb.runTransaction(async (transaction) => {
        const userDocRef = adminDb.collection('users').doc(user_id);
        const userDoc = await transaction.get(userDocRef);

        if (!userDoc.exists) {
            console.error(`Webhook error: User document for user_id ${user_id} not found.`);
            // Don't throw to avoid retries for a non-existent user.
            return;
        }

        const subscriptionUpdateData = {
          planId: plan_id,
          status: 'Active',
          billingCycle: billing_cycle,
          nextBillingDate: billing_cycle === 'annually'
            ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
            : new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
          trialEnds: null,
        };

        // Update the user's subscription details.
        transaction.update(userDocRef, {
          subscription: subscriptionUpdateData,
          updatedAt: adminDb.FieldValue.serverTimestamp(),
        });

        // 2. Increment promo code usage idempotently if one was used.
        if (promo_code) {
          const promoQuery = adminDb.collection('promotionalCodes').where('code', '==', promo_code.toUpperCase()).limit(1);
          const promoSnapshot = await promoQuery.get(); // Note: get() inside transaction is fine

          if (!promoSnapshot.empty) {
            const promoDocRef = promoSnapshot.docs[0].ref;
            const paystackReference = reference;
            
            // Use a subcollection to record unique usages to ensure idempotency
            const usageRecordRef = promoDocRef.collection('recordedUsages').doc(paystackReference);
            const usageRecordSnap = await transaction.get(usageRecordRef);

            if (!usageRecordSnap.exists) {
              // This is a new, unrecorded usage. Increment and record.
              const currentUses = promoSnapshot.docs[0].data()?.timesUsed || 0;
              transaction.update(promoDocRef, { timesUsed: currentUses + 1 });
              transaction.set(usageRecordRef, {
                timestamp: adminDb.FieldValue.serverTimestamp(),
                paymentReference: paystackReference,
                userId: user_id,
                amount: amount,
              });
              console.log(`Promo code ${promo_code} usage incremented and recorded for reference ${paystackReference}.`);
            } else {
              // This usage has already been recorded (e.g., from a webhook retry).
              console.log(`Idempotency check: Promo code usage for reference ${paystackReference} already recorded. Skipping increment.`);
            }
          } else {
              console.warn(`Webhook warning: Promo code ${promo_code} used in payment but not found in database.`);
          }
        }
      });
      
      console.log(`Successfully processed webhook for reference ${reference}.`);
      return NextResponse.json({ status: 'success' }, { status: 200 });

    } catch (error: any) {
      console.error(`CRITICAL: Error processing webhook transaction for reference ${reference}:`, error);
      // Return a 500 error to signal to Paystack that something went wrong and it should retry.
      return NextResponse.json({ status: 'error', message: 'Internal server error processing webhook.' }, { status: 500 });
    }
  }

  // Acknowledge other events without processing them
  return NextResponse.json({ status: 'success', message: 'Webhook received.' }, { status: 200 });
}
