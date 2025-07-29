
/**
 * @fileOverview TypeScript type definitions for the Records Management feature.
 */
import type { PaymentSource } from './finance';

export const recordCategories = ['Licensing Fee', 'Filing Fee', 'Software Subscription', 'Administrative Cost', 'Audit Fee', 'Other'] as const;
export type RecordCategory = typeof recordCategories[number];

export interface RecordsManagementRecord {
  id: string; // Firestore document ID
  tenantId: string;
  name: string; // e.g., "Business Operating Permit 2024", "QuickBooks Subscription"
  category: RecordCategory;
  cost: number;
  paymentSource: PaymentSource;
  paymentDate: string; // ISO yyyy-MM-dd
  expiryDate?: string; // ISO yyyy-MM-dd, for licenses/subscriptions
  vendor?: string;
  documentUrl?: string; // Link to the actual document if stored online
  notes?: string;
  createdAt: any;
  updatedAt: any;
}
