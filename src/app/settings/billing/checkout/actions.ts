
'use server';

// This server action is now only used for initializing Paystack.
// Promo code validation has been moved to Firestore security rules.

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

  if (!baseUrl || baseUrl.includes('YOUR_')) {
    return {
      success: false,
      message: "The application's public URL (NEXT_PUBLIC_BASE_URL) is not configured correctly. Cannot generate payment links. Please check your .env file.",
    };
  }

  if (!secretKey || secretKey.includes('YOUR_SECRET_KEY')) {
    console.error("Paystack secret key is not configured or is a placeholder.");
    return { success: false, message: "The payment gateway is not configured correctly on the server. Please contact support." };
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
