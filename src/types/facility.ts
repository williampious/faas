
/**
 * @fileOverview TypeScript type definitions for the Facility Management feature.
 */
import type { PaymentSource } from './finance';

export const facilityCategories = ['Rent', 'Utilities', 'Maintenance', 'Insurance', 'Security', 'Vendor Contract', 'Other'] as const;
export type FacilityCategory = typeof facilityCategories[number];

export interface FacilityRecord {
  id: string; // Firestore document ID
  tenantId: string;
  name: string; // e.g., "Monthly Office Rent", "AC Repair"
  category: FacilityCategory;
  cost: number;
  paymentSource: PaymentSource;
  paymentDate: string; // ISO yyyy-MM-dd
  vendor?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}
