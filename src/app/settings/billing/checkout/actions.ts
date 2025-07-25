

'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { PromotionalCode } from '@/types/promo-code';
import { parseISO, isAfter } from 'date-fns';

interface PromoCodeValidationResult {
  success: boolean;
  message: string;
  discountAmount?: number;
  discountPercentage?: number;
  isFullDiscount?: boolean;
}

export async function validatePromoCode(code: string): Promise<PromoCodeValidationResult> {
  if (!code) {
    return { success: false, message: 'Promotional code cannot be empty.' };
  }
  
  if (!adminDb) {
    return { 
        success: false, 
        message: "Server configuration error. The admin database is not available. This is the most common setup issue and is likely due to missing server-side secrets. Please contact the administrator and refer them to the README file." 
    };
  }

  const upperCaseCode = code.toUpperCase();

  // Handle special, hardcoded codes
  if (upperCaseCode === 'FREEBIZYEAR') {
    return { success: true, message: 'Success! You have unlocked one free year of the Business Plan.', isFullDiscount: true };
  }
  
  if (upperCaseCode === 'BIZ97') {
    return { success: true, message: 'Success! You have unlocked a 97% discount on the annual Business Plan.', discountPercentage: 97 };
  }

  const promoCodeRef = adminDb.collection('promotionalCodes').where('code', '==', upperCaseCode);

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

    const discountAmount = promoData.type === 'fixed' ? promoData.discountAmount : 0;
    const discountPercentage = promoData.type === 'percentage' ? promoData.discountAmount : 0;
    
    let message = 'Promotional code applied successfully!';
    if (discountAmount > 0) {
      message = `Success! A discount of GHS ${discountAmount.toFixed(2)} has been applied.`;
    } else if (discountPercentage > 0) {
      message = `Success! A discount of ${discountPercentage}% has been applied.`;
    }
    
    return { success: true, message, discountAmount, discountPercentage };

  } catch (error: any) {
    console.error("Error validating promo code:", error);
    return { success: false, message: 'An error occurred while validating the code.' };
  }
}

interface UserInfoForPayment {
  userId: string;
  email: string;
  fullName: string;
}

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
  userInfo: UserInfoForPayment,
  amountInKobo: number,
  planId: string,
  billingCycle: string,
  promoCode?: string,
): Promise<InitializePaymentResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const paystackUrl = 'https://api.paystack.co/transaction/initialize';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    return {
      success: false,
      message: "The application's public URL (NEXT_PUBLIC_BASE_URL) is not configured. Cannot generate payment links.",
    };
  }

  if (!secretKey || secretKey.includes("YOUR_SECRET_KEY")) {
    console.error("Paystack secret key is not configured.");
    return { success: false, message: "Payment gateway is not configured correctly. Please contact support." };
  }

  if (!userInfo.email) {
    return { success: false, message: "User email address is missing. Cannot initiate payment." };
  }

  const payload: any = {
    email: userInfo.email,
    amount: amountInKobo,
    currency: "GHS",
    metadata: {
      user_id: userInfo.userId,
      full_name: userInfo.fullName,
      plan_id: planId,
      billing_cycle: billingCycle,
      promo_code: promoCode || null,
      cancel_action: `${baseUrl}/settings/billing`,
    },
    callback_url: `${baseUrl}/settings/billing/verify`,
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

    return { success: true, message: "Transaction initialized successfully.", data: result.data };
  } catch (error: any) {
    console.error("Error initializing Paystack transaction:", error);
    return { success: false, message: "A network error occurred. Please try again." };
  }
}
