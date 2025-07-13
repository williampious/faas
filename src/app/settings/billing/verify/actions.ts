
'use server';

interface VerificationInput {
  reference: string;
}

interface VerificationResult {
  success: boolean;
  message: string;
}

/**
 * Verifies a Paystack transaction reference to confirm its status.
 * This action does NOT update the database. It only confirms the payment status with Paystack.
 * The webhook is the source of truth for database updates.
 */
export async function verifyPaystackTransaction(input: VerificationInput): Promise<VerificationResult> {
  const { reference } = input;
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
    
    // Transaction is successful. Return success message.
    return { success: true, message: "Your payment has been successfully confirmed!" };

  } catch (error: any) {
    console.error("Error verifying Paystack transaction:", error);
    return { success: false, message: "A server error occurred during verification." };
  }
}
