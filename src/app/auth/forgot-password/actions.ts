
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
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
    };
  } catch (error: any) {
    console.error('Password reset error:', error);
    // Return a generic message to avoid leaking information about which emails are registered.
    return {
      success: true, // Still return success to prevent email enumeration
      message: 'If an account with this email exists, a password reset link has been sent.',
    };
  }
}
