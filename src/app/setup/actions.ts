'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { doc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';
import type { Farm, SubscriptionDetails, UserRole } from '@/types';
import { add } from 'date-fns';

interface ActionResult {
  success: boolean;
  message: string;
  tenantId?: string;
  redirectTo?: string;
}

interface FarmerSetupData {
  userId: string;
  name: string;
  country: string;
  region: string;
  description?: string;
}

export async function createTenantAndAssignAdmin(data: FarmerSetupData): Promise<ActionResult> {
  const { userId, name, country, region, description } = data;
  let adminDb;
  try {
    adminDb = getAdminDb();
  } catch (error: any) {
    console.error("Error getting admin DB:", error);
    return { success: false, message: `Server configuration error: ${error.message}` };
  }

  const tenantRef = doc(collection(adminDb, 'tenants'));
  const userRef = doc(adminDb, 'users', userId);

  const trialEndDate = add(new Date(), { days: 20 });
  const initialSubscription: SubscriptionDetails = {
    planId: 'business',
    status: 'Trialing',
    billingCycle: 'annually',
    nextBillingDate: null,
    trialEnds: trialEndDate.toISOString(),
  };

  const newTenant: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'> = {
    name,
    country,
    region,
    description: description || '',
    ownerId: userId,
    currency: 'GHS',
    subscription: initialSubscription,
  };

  try {
    const batch = writeBatch(adminDb);
    batch.set(tenantRef, { ...newTenant, id: tenantRef.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    batch.update(userRef, {
      tenantId: tenantRef.id,
      role: ['Admin'] as UserRole[],
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    return { success: true, message: `Farm "${name}" created successfully.`, tenantId: tenantRef.id, redirectTo: '/dashboard' };
  } catch (error: any) {
    console.error("Error in createTenantAndAssignAdmin:", error);
    return { success: false, message: `Failed to create farm: ${error.message}` };
  }
}

interface AeoSetupData {
  userId: string;
  organization?: string;
  assignedRegion: string;
  assignedDistrict: string;
}

export async function setupAeoProfile(data: AeoSetupData): Promise<ActionResult> {
  const { userId, organization, assignedRegion, assignedDistrict } = data;
  let adminDb;
  try {
    adminDb = getAdminDb();
  } catch (error: any) {
    return { success: false, message: `Server configuration error: ${error.message}` };
  }

  const userRef = doc(adminDb, 'users', userId);

  try {
    await updateDoc(userRef, {
      role: ['Agric Extension Officer'] as UserRole[],
      assignedRegion,
      assignedDistrict,
      organization: organization || null,
      updatedAt: serverTimestamp(),
    });
    return { success: true, message: "AEO profile set up successfully.", redirectTo: '/aeo/dashboard' };
  } catch (error: any) {
    console.error("Error setting up AEO profile:", error);
    return { success: false, message: `Failed to set up profile: ${error.message}` };
  }
}

interface CooperativeSetupData {
    userId: string;
    name: string;
    country: string;
    region: string;
    assignedDistrict: string;
    description?: string;
}

export async function createCooperativeAndAssignRoles(data: CooperativeSetupData): Promise<ActionResult> {
    const { userId, name, country, region, assignedDistrict, description } = data;
    let adminDb;
    try {
        adminDb = getAdminDb();
    } catch (error: any) {
        return { success: false, message: `Server configuration error: ${error.message}` };
    }

    const tenantRef = doc(collection(adminDb, 'tenants'));
    const userRef = doc(adminDb, 'users', userId);

    const trialEndDate = add(new Date(), { days: 20 });
    const initialSubscription: SubscriptionDetails = {
        planId: 'business',
        status: 'Trialing',
        billingCycle: 'annually',
        nextBillingDate: null,
        trialEnds: trialEndDate.toISOString(),
    };

    const newTenant: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'> = {
        name, country, region,
        description: description || '',
        ownerId: userId,
        currency: 'GHS',
        subscription: initialSubscription,
    };

    try {
        const batch = writeBatch(adminDb);
        batch.set(tenantRef, { ...newTenant, id: tenantRef.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        batch.update(userRef, { 
            tenantId: tenantRef.id, 
            role: ['Admin', 'Agric Extension Officer'] as UserRole[],
            assignedRegion: region,
            assignedDistrict: assignedDistrict,
            organization: name,
            updatedAt: serverTimestamp()
        });
        
        await batch.commit();
        return { success: true, message: `Cooperative "${name}" created successfully.`, redirectTo: '/dashboard' };
    } catch (error: any) {
        console.error("Error creating cooperative:", error);
        return { success: false, message: `Failed to create cooperative: ${error.message}` };
    }
}
