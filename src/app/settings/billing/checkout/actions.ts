

'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";

interface PromoCodeValidationResult {
  success: boolean;
  message: string;
  discountAmount?: number;
  discountPercentage?: number;
  isFullDiscount?: boolean;
}

export async function validatePromoCode(code: string, userId: string): Promise<PromoCodeValidationResult> {
  if (!code || !userId) {
    return { success: false, message: 'Promo code and user ID are required.' };
  }

  const upperCaseCode = code.toUpperCase();
  
  try {
    const activationData = {
      code: upperCaseCode,
      userId: userId,
      attemptedAt: serverTimestamp(),
    };
    
    // The security rule will validate this write. If it fails, the catch block will run.
    await addDoc(collection(db, 'promoCodeActivations'), activationData);
    
    // If write succeeds, validation passed. Fetch code details to return discount.
    const promoCodeRef = doc(db, 'promotionalCodes', upperCaseCode);
    const docSnap = await getDoc(promoCodeRef);
    
    if (docSnap.exists()) {
        const promoData = docSnap.data();
        const discountAmount = promoData.type === 'fixed' ? promoData.discountAmount : 0;
        const discountPercentage = promoData.type === 'percentage' ? promoData.discountAmount : 0;
        const isFullDiscount = promoData.type === 'percentage' && promoData.discountAmount >= 100;
        
        let message = 'Promotional code applied successfully!';
        if(isFullDiscount) message = 'Success! Your plan will be activated at no cost.';
        
        return { success: true, message, discountAmount, discountPercentage, isFullDiscount };
    } else {
        // This case should be rare if rules are set up correctly
        return { success: false, message: 'Code validated but details could not be retrieved.' };
    }

  } catch (error: any) {
    console.error("Promo code validation failed:", error.message);
    if (error.code === 'permission-denied') {
        return { success: false, message: "This code is invalid, expired, or has reached its usage limit." };
    }
    return { success: false, message: 'An error occurred while validating the code.' };
  }
}

interface UserInfoForPayment {
  userId: string;
  tenantId: string;
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

  if (!baseUrl || baseUrl.includes('YOUR_')) {
    return {
      success: false,
      message: "Application's public URL (NEXT_PUBLIC_BASE_URL) is not configured correctly.",
    };
  }

  if (!secretKey || secretKey.includes('YOUR_SECRET_KEY')) {
    return { success: false, message: "Payment gateway is not configured correctly on the server." };
  }

  if (!userInfo.email) {
    return { success: false, message: "User email address is missing." };
  }

  const payload = {
    email: userInfo.email,
    amount: amountInKobo,
    currency: "GHS",
    metadata: {
      user_id: userInfo.userId,
      tenant_id: userInfo.tenantId,
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
      return { success: false, message: result.message || "Error initiating transaction." };
    }

    return { success: true, message: "Transaction initialized.", data: result.data };
  } catch (error: any) {
    return { success: false, message: "A network error occurred." };
  }
}
