
'use server';

import type { AgriFAASUserProfile } from "@/types/user";

interface InitializePaymentResult {
  success: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function initializePaystackTransaction(
  userProfile: AgriFAASUserProfile, 
  amountInKobo: number, // Paystack requires amount in the lowest currency unit (kobo for GHS)
  planId: string,
  billingCycle: string
): Promise<InitializePaymentResult> {
  
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const paystackUrl = 'https://api.paystack.co/transaction/initialize';

  if (!secretKey || secretKey.includes("YOUR_SECRET_KEY")) {
    console.error("Paystack secret key is not configured in .env file.");
    return {
      success: false,
      message: "Payment gateway is not configured correctly. Please contact support.",
    };
  }
  
  if (!userProfile.emailAddress) {
     return {
      success: false,
      message: "User email address is missing. Cannot initiate payment.",
    };
  }

  const payload = {
    email: userProfile.emailAddress,
    amount: amountInKobo,
    currency: "GHS",
    metadata: {
      user_id: userProfile.userId,
      full_name: userProfile.fullName,
      plan_id: planId,
      billing_cycle: billingCycle,
      cancel_action: `${process.env.NEXT_PUBLIC_BASE_URL}/settings/billing`, // URL to redirect to on cancel
    },
    callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings/billing/verify?planId=${planId}&billingCycle=${billingCycle}`, // URL for verification after payment
  };

  try {
    const response = await fetch(paystackUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.status) {
      console.error("Paystack API Error:", result);
      return { success: false, message: result.message || "An error occurred while initiating the transaction." };
    }

    return {
      success: true,
      message: "Transaction initialized successfully.",
      data: result.data,
    };

  } catch (error: any) {
    console.error("Error initializing Paystack transaction:", error);
    return {
      success: false,
      message: "A network error occurred. Please try again.",
    };
  }
}
