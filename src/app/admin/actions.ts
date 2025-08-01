'use server';

import { config } from 'dotenv';
config();

import { getAdminDb } from '@/lib/firebase-admin';
import { doc, writeBatch, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import type { Farm } from '@/types/farm';
import type { AgriFAASUserProfile, UserRole, SubscriptionDetails } from '@/types/user';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail as send } from '@/lib/email';
import { add } from 'date-fns';

interface CreateTenantData {
  tenantName: string;
  adminFullName: string;
  adminEmail: string;
}

interface ActionResult {
  success: boolean;
  message: string;
}

export async function createNewTenant(data: CreateTenantData): Promise<ActionResult> {
  let adminDb;
  try {
    adminDb = getAdminDb();
  } catch (error: any) {
    console.error('[createNewTenant]', error.message);
    return { success: false, message: error.message };
  }
  
  const { tenantName, adminFullName, adminEmail } = data;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  if (!baseUrl) {
      return { success: false, message: "Application Base URL is not configured. Cannot generate invitation links." };
  }

  try {
    const usersRef = collection(adminDb, 'users');
    const q = query(usersRef, where("emailAddress", "==", adminEmail), where("accountStatus", "==", "Active"));
    const existingUserSnapshot = await getDocs(q);

    if (!existingUserSnapshot.empty) {
      return { success: false, message: "An active user with this email address already exists on the platform." };
    }
  } catch(e: any) {
      console.error("Error checking for existing user:", e);
      return { success: false, message: `Database error during user check: ${e.message}`};
  }

  const batch = writeBatch(adminDb);
  
  const tenantRef = doc(collection(adminDb, 'tenants'));

  const trialEndDate = add(new Date(), { days: 20 });
  const initialSubscription: SubscriptionDetails = {
      planId: 'business',
      status: 'Trialing',
      billingCycle: 'annually',
      nextBillingDate: null,
      trialEnds: trialEndDate.toISOString(),
  };

  const newTenant: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'> = {
    name: tenantName,
    ownerId: '',
    currency: 'GHS',
    country: 'Ghana', 
    region: 'Greater Accra',
    subscription: initialSubscription,
  };
  batch.set(tenantRef, { ...newTenant, id: tenantRef.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

  const invitedUserId = uuidv4();
  const invitationToken = uuidv4();
  const userDocRef = doc(adminDb, 'users', invitedUserId);
  
  const newUserProfile: Partial<AgriFAASUserProfile> = {
    userId: invitedUserId,
    tenantId: tenantRef.id,
    fullName: adminFullName,
    emailAddress: adminEmail,
    role: ['Admin'] as UserRole[],
    accountStatus: 'Invited',
    invitationToken: invitationToken,
    invitationSentAt: serverTimestamp(),
    avatarUrl: `https://placehold.co/100x100.png?text=${adminFullName.charAt(0)}`,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  batch.set(userDocRef, newUserProfile);
  
  batch.update(tenantRef, { ownerId: invitedUserId });

  const inviteLink = `${baseUrl}/auth/complete-registration?token=${invitationToken}`;
  const emailResult = await send({
    to: adminEmail,
    subject: `You're invited to manage ${tenantName} on AgriFAAS Connect!`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${adminFullName},</h2>
        <p>You have been invited to become the administrator for <strong>${tenantName}</strong> on the AgriFAAS Connect platform.</p>
        <p>To accept the invitation and set up your administrator account, please click the link below. This link is valid for 48 hours.</p>
        <p style="text-align: center;">
          <a href="${inviteLink}" style="background-color: #8CC63F; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Set Up Your Admin Account</a>
        </p>
        <p>If you cannot click the button, please copy and paste this link into your browser:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>
        <br>
        <p>Thank you,</p>
        <p>The AgriFAAS Connect Team</p>
      </div>
    `,
  });

  if (!emailResult.success) {
    console.error("Failed to send invitation email:", emailResult.message);
  }

  try {
    await batch.commit();
    return { success: true, message: `Tenant ${tenantName} created and invitation sent.` };
  } catch (error: any) {
    console.error("Error committing batch operation for new tenant:", error);
    return { success: false, message: `Failed to create tenant in database: ${error.message}` };
  }
}
