
// src/app/api/webhooks/paystack/route.ts
// This file is a standard Next.js API Route handler.
// It should NOT use the 'use server' directive.

import { NextResponse } from 'next/server';
import { updateUserSubscription } from '@/app/settings/billing/actions';
import crypto from 'crypto';

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("Paystack secret key is not configured.");
    return new NextResponse("Configuration error: Paystack secret key not set", { status: 500 });
  }

  try {
    const text = await request.text();
    const signature = request.headers.get("x-paystack-signature");
    
    const hash = crypto
      .createHmac('sha512', secret)
      .update(text)
      .digest('hex');

    if (hash !== signature) {
      console.warn("Paystack webhook signature verification failed.");
      return new NextResponse("Signature verification failed", { status: 401 });
    }

    const event = JSON.parse(text);

    if (event.event === 'charge.success') {
      const { user_id, plan_id, billing_cycle } = event.data.metadata;
      
      if (!user_id || !plan_id || !billing_cycle) {
        console.error("Webhook received with missing metadata:", event.data.metadata);
        return new NextResponse("Webhook Error: Missing required metadata", { status: 400 });
      }

      console.log(`Processing successful payment for user: ${user_id}, plan: ${plan_id}`);
      
      // Call the server action to update the user's subscription in Firestore
      const updateResult = await updateUserSubscription(user_id, plan_id, billing_cycle);

      if (!updateResult.success) {
        console.error(`Failed to update subscription in Firestore for user ${user_id}:`, updateResult.message);
        // Even if DB update fails, acknowledge receipt to Paystack to prevent retries
        // The failure should be logged for manual intervention.
        return new NextResponse("Webhook processed, but database update failed.", { status: 500 });
      }

      console.log(`Successfully updated subscription for user ${user_id}.`);
    }

    return new NextResponse("Webhook received successfully", { status: 200 });

  } catch (error: any) {
    console.error("Error processing Paystack webhook:", error);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }
}
