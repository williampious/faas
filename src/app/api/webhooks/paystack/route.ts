
// src/app/api/webhooks/paystack/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { updateUserSubscription } from '@/app/settings/billing/actions';
import { adminDb } from '@/lib/firebase-admin';
import type { FieldValue } from 'firebase-admin/firestore';

/**
 * Handles Paystack webhook events.
 * This is the definitive source of truth for successful payments.
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

    console.log(`Processing successful payment for user ${user_id}, plan ${plan_id}, reference ${reference}`);

    try {
      // 1. Update user subscription (This action is self-contained and can be run first)
      const subResult = await updateUserSubscription(user_id, plan_id, billing_cycle);
      if (!subResult.success) {
        // Log critical error if subscription update fails after payment
        console.error(`CRITICAL: Payment successful (Ref: ${reference}) but failed to update subscription for user ${user_id}. Reason: ${subResult.message}`);
        // Still return 200 to Paystack to prevent retries, but log the issue for manual follow-up.
        return NextResponse.json({ status: 'success', message: 'Webhook received, but subscription update failed server-side.' });
      }

      // 2. Increment promo code usage idempotently if one was used
      if (promo_code && adminDb) {
          const promoQuery = adminDb.collection('promotionalCodes').where('code', '==', promo_code.toUpperCase()).limit(1);
          const promoSnapshot = await promoQuery.get();

          if (!promoSnapshot.empty) {
              const promoDocRef = promoSnapshot.docs[0].ref;
              const paystackReference = reference;

              await adminDb.runTransaction(async (transaction) => {
                  const promoDoc = await transaction.get(promoDocRef);
                  if (!promoDoc.exists) {
                      console.error(`Promo code document not found during transaction for code: ${promo_code}`);
                      return;
                  }
                  
                  // Use a subcollection to record unique usages to ensure idempotency
                  const usageRecordRef = promoDocRef.collection('recordedUsages').doc(paystackReference);
                  const usageRecord = await transaction.get(usageRecordRef);

                  if (!usageRecord.exists) {
                      // This is a new, unrecorded usage.
                      const currentUses = promoDoc.data()?.timesUsed || 0;
                      transaction.update(promoDocRef, { timesUsed: currentUses + 1 });
                      transaction.set(usageRecordRef, {
                          timestamp: adminDb.FieldValue.serverTimestamp() as FieldValue,
                          paymentReference: paystackReference,
                          userId: user_id,
                      });
                      console.log(`Promo code ${promo_code} usage incremented and recorded for reference ${paystackReference}.`);
                  } else {
                      // This usage has already been recorded (webhook retry).
                      console.log(`Promo code ${promo_code} usage for reference ${paystackReference} already recorded. Skipping increment.`);
                  }
              });
          }
      }

      console.log(`Successfully processed webhook for user ${user_id}.`);
      return NextResponse.json({ status: 'success' }, { status: 200 });

    } catch (error: any) {
      console.error(`Error processing webhook for reference ${reference}:`, error);
      return NextResponse.json({ status: 'error', message: 'Internal server error processing webhook.' }, { status: 500 });
    }
  }

  // Acknowledge other events without processing them
  return NextResponse.json({ status: 'success', message: 'Webhook received.' }, { status: 200 });
}
