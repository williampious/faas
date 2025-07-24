
// src/app/api/webhooks/paystack/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { updateUserSubscription } from '@/app/settings/billing/actions';
import { adminDb } from '@/lib/firebase-admin';

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
      // 1. Update user subscription
      const subResult = await updateUserSubscription(user_id, plan_id, billing_cycle);
      if (!subResult.success) {
        // Log critical error if subscription update fails after payment
        console.error(`CRITICAL: Payment successful (Ref: ${reference}) but failed to update subscription for user ${user_id}. Reason: ${subResult.message}`);
        // Still return 200 to Paystack to prevent retries, but log the issue for manual follow-up.
        return NextResponse.json({ status: 'success', message: 'Webhook received, but subscription update failed server-side.' });
      }

      // 2. Increment promo code usage if one was used
      if (promo_code && adminDb) {
          const promoQuery = adminDb.collection('promotionalCodes').where('code', '==', promo_code.toUpperCase()).limit(1);
          const promoSnapshot = await promoQuery.get();
          if (!promoSnapshot.empty) {
              const promoDoc = promoSnapshot.docs[0];
              const currentUses = promoDoc.data().timesUsed || 0;
              await promoDoc.ref.update({ timesUsed: currentUses + 1 });
              console.log(`Promo code ${promo_code} usage incremented.`);
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
