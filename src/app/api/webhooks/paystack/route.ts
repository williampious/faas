// src/app/api/webhooks/paystack/route.ts

import { NextResponse } from 'next/server'; // Only import what's strictly needed for this test

export async function POST() {
  console.log('Minimal Paystack Webhook hit!');
  return NextResponse.json({ status: 'success', message: 'Test webhook received!' }, { status: 200 });
}

// Ensure there are ABSOLUTELY NO OTHER top-level 'export' statements in this file.
// Do NOT include any other imports (like crypto or updateUserSubscription) yet.
// Do NOT include any other functions or variables defined outside the POST function.
