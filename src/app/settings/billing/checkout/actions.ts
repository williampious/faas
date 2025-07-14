
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

interface PromoCodeValidationResult {
    success: boolean;
    message: string;
    discountAmount?: number;
}

// Hardcoded promo codes for demonstration. In a real app, this would query Firestore.
const validPromoCodes: Array<{ code: string, type: 'fixed' | 'percentage', value: number, active: boolean }> = [
    { code: 'SAVE50', type: 'fixed', value: 50, active: true },
    { code: 'AGRIFAAS100', type: 'fixed', value: 100, active: true },
    { code: 'EXPIREDCODE', type: 'fixed', value: 20, active: false }, // Simulating an inactive code
    { code: 'FREEBIZYEAR', type: 'fixed', value: 4499, active: true }, // 100% discount on annual business plan
];

export async function validatePromoCode(code: string): Promise<PromoCodeValidationResult> {
    const promoCode = validPromoCodes.find(p => p.code.toUpperCase() === code.toUpperCase());

    if (!promoCode) {
        return { success: false, message: 'Invalid promotional code.' };
    }
    if (!promoCode.active) {
        return { success: false, message: 'This promotional code is no longer active.' };
    }
    
    // Here you could add more complex logic like checking expiry dates, usage limits, or if the user has used it before.
    
    return { 
        success: true, 
        message: `Success! A discount of GHS ${promoCode.value.toFixed(2)} has been applied.`,
        discountAmount: promoCode.value 
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
