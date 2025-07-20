
'use server';

import type { AgriFAASUserProfile, PromotionalCode } from "@/types/user";
import { adminDb } from '@/lib/firebase-admin';
import { parseISO, isAfter } from 'date-fns';

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

export async function validatePromoCode(code: string): Promise<PromoCodeValidationResult> {
    if (!adminDb) {
      return { success: false, message: 'Database service is unavailable. Cannot validate code.' };
    }
    if (!code) {
        return { success: false, message: 'Promotional code cannot be empty.' };
    }

    const promoCodeRef = adminDb.collection('promotionalCodes').where('code', '==', code.toUpperCase());

    try {
        const snapshot = await promoCodeRef.get();

        if (snapshot.empty) {
            return { success: false, message: 'Invalid promotional code.' };
        }

        const promoDoc = snapshot.docs[0];
        const promoData = promoDoc.data() as PromotionalCode;

        if (!promoData.isActive) {
            return { success: false, message: 'This promotional code is no longer active.' };
        }

        const now = new Date();
        const expiryDate = parseISO(promoData.expiryDate);
        if (isAfter(now, expiryDate)) {
            return { success: false, message: 'This promotional code has expired.' };
        }

        if (promoData.timesUsed >= promoData.usageLimit) {
            return { success: false, message: 'This promotional code has reached its usage limit.' };
        }

        // In a real application, you might also check if this specific user has already used this code.
        
        const discountAmount = promoData.type === 'fixed' ? promoData.discountAmount : 0; // Assuming only fixed for now

        return { 
            success: true, 
            message: `Success! A discount of GHS ${discountAmount.toFixed(2)} has been applied.`,
            discountAmount: discountAmount
        };

    } catch (error: any) {
        console.error("Error validating promo code:", error);
        return { success: false, message: 'An error occurred while validating the code.' };
    }
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
