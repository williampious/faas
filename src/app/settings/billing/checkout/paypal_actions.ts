

'use server';

import type { AgriFAASUserProfile, PromotionalCode } from "@/types/user";
import { adminDb } from '@/lib/firebase-admin';

// Base URL for PayPal API
const base = "https://api-m.sandbox.paypal.com"; // Using Sandbox for development

interface PayPalOrderResult {
  success: boolean;
  orderId?: string;
  message: string;
}

interface PayPalCaptureResult {
    success: boolean;
    message: string;
    data?: any;
}


/**
 * Generates an access token from PayPal.
 */
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID; // SDK uses public ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal API credentials are not configured in the environment.");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("PayPal Auth Error:", data);
    throw new Error("Failed to get PayPal access token.");
  }
  return data.access_token;
}

/**
 * Creates a PayPal order.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
export async function createPayPalOrder(
    amountInGHS: number, 
    planId: string, 
    billingCycle: string
): Promise<PayPalOrderResult> {
  try {
    const accessToken = await getPayPalAccessToken();
    const url = `${base}/v2/checkout/orders`;

    // TODO: Replace this with a real-time exchange rate API call.
    const GHS_TO_USD_RATE = 15.0; 
    const amountInUSD = (amountInGHS / GHS_TO_USD_RATE).toFixed(2);

    const payload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amountInUSD,
          },
          custom_id: `${planId}__${billingCycle}`,
          description: `AgriFAAS Connect Subscription: ${planId} (${billingCycle})`,
        },
      ],
    };
    
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      method: "POST",
      body: JSON.stringify(payload),
    });
    
    const jsonResponse = await response.json();

    if (!response.ok) {
        console.error("PayPal API Error on create:", jsonResponse);
        return { success: false, message: jsonResponse.message || "Failed to create PayPal order." };
    }

    return { success: true, orderId: jsonResponse.id, message: "Order created successfully." };

  } catch (error: any) {
    console.error("Error creating PayPal order:", error);
    return { success: false, message: `Server error: ${error.message}` };
  }
}

/**
 * Captures a payment for an order.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
export async function capturePayPalOrder(orderID: string): Promise<PayPalCaptureResult> {
  try {
    const accessToken = await getPayPalAccessToken();
    const url = `${base}/v2/checkout/orders/${orderID}/capture`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const data = await response.json();

    if (response.ok && data.status === 'COMPLETED') {
        return { success: true, message: "Payment captured successfully.", data };
    } else {
        console.error("PayPal Capture Error:", data);
        return { success: false, message: data.message || "Failed to capture payment.", data };
    }

  } catch(error: any) {
      console.error("Error capturing PayPal order:", error);
      return { success: false, message: `Server error during capture: ${error.message}` };
  }
}
