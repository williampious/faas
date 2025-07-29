
'use server';

import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

interface ActionResult {
  success: boolean;
  message: string;
}

export async function sendPasswordReset(email: string): Promise<ActionResult> {
  if (!auth) {
    return {
      success: false,
      message: 'Authentication service is not available. Please try again later.',
    };
  }

  try {
    // This is the correct usage according to Firebase SDK v9+
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
    };
  } catch (error: any) {
    console.error('Password reset error:', error);
    // To prevent email enumeration, we return a generic success message even on failure.
    // The user experience is the same: "If an account exists, an email is sent."
    return {
      success: true, 
      message: 'If an account with this email exists, a password reset link has been sent.',
    };
  }
}
