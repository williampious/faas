/**
 * @fileOverview TypeScript type definitions for the Safety & Security feature.
 */
import type { PaymentSource } from './finance';

export const safetyCategories = ['Compliance', 'Insurance', 'Security Service', 'Safety Training', 'Safety Equipment', 'Other'] as const;
export type SafetyCategory = typeof safetyCategories[number];

export interface SafetySecurityRecord {
  id: string; // Firestore document ID
  farmId: string;
  name: string; // e.g., "Annual Fire Safety Inspection", "General Liability Insurance"
  category: SafetyCategory;
  cost: number;
  paymentSource: PaymentSource;
  paymentDate: string; // ISO yyyy-MM-dd
  provider: string; // e.g., "Ghana National Fire Service", "Allianz Insurance"
  policyNumber?: string;
  expiryDate?: string; // ISO yyyy-MM-dd
  notes?: string;
  createdAt: any;
  updatedAt: any;
}
