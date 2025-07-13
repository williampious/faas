
// src/app/api/webhooks/paystack/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateUserSubscription } from '@/app/settings/billing/actions';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: NextRequest) {
  if (!PAYSTACK_SECRET_KEY) {
    console.error('[Paystack Webhook] Paystack secret key is not configured.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      console.warn('[Paystack Webhook] Missing signature header.');
      return NextResponse.json({ error: 'Missing webhook signature.' }, { status: 400 });
    }

    // IMPORTANT: Verify the webhook signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      console.warn('[Paystack Webhook] Invalid signature.');
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log(`[Paystack Webhook] Received event: ${event.event}`);

    // Process the event
    if (event.event === 'charge.success') {
      const { data } = event;
      
      // Extract metadata
      const { user_id, plan_id, billing_cycle } = data.metadata;
      
      // Check if essential metadata is present
      if (!user_id || !plan_id || !billing_cycle) {
        console.error('[Paystack Webhook] Missing metadata in successful charge event.', data.metadata);
        // Respond with 200 to Paystack so it doesn't retry, but log the error for investigation.
        return NextResponse.json({ status: 'success', message: 'Webhook received, but metadata was missing.' }, { status: 200 });
      }

      console.log(`[Paystack Webhook] Processing charge.success for user ${user_id}, plan ${plan_id}`);
      
      // Update user's subscription in Firestore using the centralized server action
      await updateUserSubscription(user_id, plan_id, billing_cycle);
    }
    
    // Add handlers for other events like `subscription.not_renew`, etc., here in the future.

    // Acknowledge receipt of the event
    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error: any) {
    console.error('[Paystack Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }
}
