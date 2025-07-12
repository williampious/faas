
'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { SubscriptionDetails } from '@/types/user';
import { add, format } from 'date-fns';

interface VerificationInput {
  reference: string;
  planId: 'starter' | 'grower' | 'business' | 'enterprise';
  billingCycle: 'monthly' | 'annually';
  userId: string;
}

interface VerificationResult {
  success: boolean;
  message: string;
}

// Data can be moved to a shared file later
const pricingTiers = [
  { id: 'starter', name: 'Starter', price: { monthly: 0, annually: 0 } },
  { id: 'grower', name: 'Grower', price: { monthly: 209, annually: 2099 } },
  { id: 'business', name: 'Business', price: { monthly: 449, annually: 4499 } },
  { id: 'enterprise', name: 'Enterprise', price: { monthly: 0, annually: 0 } },
];

export async function verifyPaystackTransaction(input: VerificationInput): Promise<VerificationResult> {
  const { reference, planId, billingCycle, userId } = input;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const paystackUrl = `https://api.paystack.co/transaction/verify/${reference}`;

  if (!secretKey) {
    return { success: false, message: "Payment gateway is not configured." };
  }

  try {
    const response = await fetch(paystackUrl, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const result = await response.json();

    if (!result.status || result.data.status !== 'success') {
      return { success: false, message: result.message || "Transaction was not successful." };
    }
    
    // --- Amount Verification ---
    const expectedPlan = pricingTiers.find(p => p.id === planId);
    if (!expectedPlan) {
      return { success: false, message: "Invalid plan ID specified." };
    }
    const expectedAmount = billingCycle === 'annually' ? expectedPlan.price.annually : expectedPlan.price.monthly;
    const expectedAmountInKobo = expectedAmount * 100;
    
    // Paystack returns amount in kobo
    if (result.data.amount !== expectedAmountInKobo) {
        console.error(`Amount mismatch: Expected ${expectedAmountInKobo}, Got ${result.data.amount}`);
        return { success: false, message: "Payment amount mismatch. Please contact support." };
    }

    // --- Update User Subscription in Firestore ---
    const userDocRef = adminDb.collection('users').doc(userId);
    
    const nextBillingDate = billingCycle === 'annually' 
      ? add(new Date(), { years: 1 })
      : add(new Date(), { months: 1 });

    const newSubscription: SubscriptionDetails = {
      planId: planId,
      status: 'Active',
      billingCycle: billingCycle, // Correctly save the billing cycle
      nextBillingDate: format(nextBillingDate, 'yyyy-MM-dd'),
    };

    await userDocRef.update({
      subscription: newSubscription,
      updatedAt: new Date().toISOString(), // Using ISO string for server-side updates
    });
    
    // Here you would also create a record in a 'transactions' or 'payments' collection
    // for your own bookkeeping, but for this step we will just update the user.

    return { success: true, message: `Your subscription to the ${expectedPlan.name} plan is now active!` };

  } catch (error: any) {
    console.error("Error verifying Paystack transaction:", error);
    return { success: false, message: "A server error occurred during verification." };
  }
}
