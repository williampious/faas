
'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { AgriFAASUserProfile } from '@/types/user';

interface ValidationResult {
  success: boolean;
  message?: string;
  userData?: {
    userId: string;
    fullName: string;
    emailAddress: string;
    // We need the full profile to carry over details like role and farmId
    profileData: AgriFAASUserProfile;
  };
}

export async function validateInvitationToken(token: string): Promise<ValidationResult> {
  if (!adminDb) {
    return {
      success: false,
      message: 'Server configuration error. The admin database is not available. Please contact support.',
    };
  }
  if (!token) {
    return { success: false, message: 'Invitation token is missing.' };
  }

  try {
    const usersRef = adminDb.collection('users');
    const q = usersRef
      .where('invitationToken', '==', token)
      .where('accountStatus', '==', 'Invited')
      .limit(1);

    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return {
        success: false,
        message: 'This invitation link is invalid, has expired, or has already been used. Please request a new invitation if needed.',
      };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = { userId: userDoc.id, ...userDoc.data() } as AgriFAASUserProfile;

    // We return the whole userData object for the final registration step.
    return {
      success: true,
      userData: {
        userId: userDoc.id,
        fullName: userData.fullName,
        emailAddress: userData.emailAddress || '',
        profileData: userData,
      },
    };
  } catch (error: any) {
    console.error('Error in validateInvitationToken server action:', error);
    return {
      success: false,
      message: 'An unexpected server error occurred while validating your invitation. Please try again later.',
    };
  }
}
