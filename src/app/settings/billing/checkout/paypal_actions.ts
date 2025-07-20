
'use server';

// Base URL for PayPal API
const base = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";

interface PayPalOrderResult {
  success: boolean;
  orderId?: string;
  message: string;
}

/**
 * Generates an access token from PayPal.
 */
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
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
  return data.access_token;
}

/**
 * Creates a PayPal order.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
export async function createPayPalOrder(amount: string): Promise<PayPalOrderResult> {
  try {
    const accessToken = await getPayPalAccessToken();
    const url = `${base}/v2/checkout/orders`;

    const payload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD", // PayPal requires specific currencies like USD
            value: amount,
          },
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
export async function capturePayPalOrder(orderID: string) {
  // This function will be needed for the PayPal verification page later.
  const accessToken = await getPayPalAccessToken();
  const url = `${base}/v2/checkout/orders/${orderID}/capture`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  return await response.json();
}
