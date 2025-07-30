'use server';

import { sendEmail as send } from '@/lib/email';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendInvitationEmail(options: EmailOptions): Promise<{ success: boolean; message: string }> {
  // This server action wraps the actual email sending logic, 
  // ensuring it can be safely called from client components without bundling server-only code.
  return await send(options);
}
